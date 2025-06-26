import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { ActivityModel } from "@/models/Activities";
import { logActivity, ActivityTypes, getClientInfo } from "@/lib/activityLogger";
import { getCurrentUserWithPermissions } from "@/lib/getCurrentUserWithPermissions";
import { 
  checkPermission, 
  checkAnyPermission, 
  checkAllPermissions,
  createPermissionErrorResponse,
  createAnyPermissionErrorResponse,
  createAllPermissionsErrorResponse
} from "@/lib/checkPermissions";

export async function GET(request: Request) {
  try {
    // Example 1: Check for ANY of these permissions (OR logic)
    const permissionCheck = await checkAnyPermission(["ACTIVITY_VIEW", "ADMIN_ACTIVITY_VIEW", "SUPER_ADMIN"]);
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        createAnyPermissionErrorResponse(["ACTIVITY_VIEW", "ADMIN_ACTIVITY_VIEW", "SUPER_ADMIN"], permissionCheck.permissions),
        { status: 403 }
      );
    }

    // Example 2: Check for ALL of these permissions (AND logic) - uncomment if needed
    // const permissionCheck = await checkAllPermissions(["ACTIVITY_VIEW", "USER_MANAGE"]);
    // if (!permissionCheck.hasPermission) {
    //   return NextResponse.json(
    //     createAllPermissionsErrorResponse(["ACTIVITY_VIEW", "USER_MANAGE"], permissionCheck.missingPermissions, permissionCheck.permissions),
    //     { status: 403 }
    //   );
    // }

    // Example 3: Single permission check (original way)
    // const permissionCheck = await checkPermission("ACTIVITY_VIEW");
    // if (!permissionCheck.hasPermission) {
    //   return NextResponse.json(
    //     createPermissionErrorResponse("ACTIVITY_VIEW", permissionCheck.permissions),
    //     { status: 403 }
    //   );
    // }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    
    // Query parameters for filtering
    const userId = searchParams.get('userId');
    const activityType = searchParams.get('activityType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (userId) query.userId = userId;
    if (activityType) query.activityType = activityType;

    const activities = await ActivityModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'fullName userName avatarURL');

    const total = await ActivityModel.countDocuments(query);

    return NextResponse.json({ 
      success: true, 
      data: activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Example: Check for ALL permissions (user needs both ACTIVITY_CREATE AND USER_MANAGE)
    const permissionCheck = await checkAllPermissions(["ACTIVITY_CREATE", "USER_MANAGE"]);
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        createAllPermissionsErrorResponse(["ACTIVITY_CREATE", "USER_MANAGE"], permissionCheck.missingPermissions, permissionCheck.permissions),
        { status: 403 }
      );
    }

    await dbConnect();
    const body = await request.json();
    
    // Validate required fields
    if (!body.userId || !body.activityType || !body.description) {
      return NextResponse.json(
        { success: false, error: "userId, activityType, and description are required" },
        { status: 400 }
      );
    }

    const newActivity = await ActivityModel.create(body);
    
    // Log this activity creation as an activity itself
    const clientInfo = getClientInfo(request);
    
    if (permissionCheck.user?._id) {
      await logActivity({
        userId: permissionCheck.user._id.toString(),
        activityType: ActivityTypes.ACTIVITY_CREATED,
        description: `Created activity: ${newActivity.activityType} for user ${newActivity.userId}`,
        metadata: { 
          activityId: newActivity._id, 
          activityType: newActivity.activityType,
          targetUserId: newActivity.userId 
        },
        ...clientInfo
      });
    }

    return NextResponse.json(
      { success: true, data: newActivity },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
} 