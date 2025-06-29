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
    await dbConnect();

    const currentUser = await getCurrentUserWithPermissions();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Super-admin bypasses permission checks
    if (currentUser.role === "super-admin") {
      const activities = await ActivityModel.find({}).sort({ createdAt: -1 });

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.ACTIVITY_VIEWED,
        description: "Viewed activities list (Super Admin)",
        metadata: { count: activities.length },
        ...getClientInfo(request)
      });

      return NextResponse.json({ success: true, data: activities });
    }

    // Admin and Manager roles need specific permissions
    if (currentUser.role === "admin" || currentUser.role === "manager") {
      const permissionCheck = await checkAnyPermission(["ACTIVITIES_VIEW", "SUPER_ADMIN"]);
      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          createAnyPermissionErrorResponse(["ACTIVITIES_VIEW", "SUPER_ADMIN"], permissionCheck.permissions),
          { status: 403 }
        );
      }

      const activities = await ActivityModel.find({}).sort({ createdAt: -1 });

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.ACTIVITY_VIEWED,
        description: `Viewed activities list (${currentUser.role})`,
        metadata: { count: activities.length },
        ...getClientInfo(request)
      });

      return NextResponse.json({ success: true, data: activities });
    }

    // For all other roles, deny access
    return NextResponse.json(
      { success: false, error: "Access denied" },
      { status: 403 }
    );
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
    const currentUser = await getCurrentUserWithPermissions();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Super-admin bypasses permission checks
    if (currentUser.role === "super-admin") {
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
      
      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.ACTIVITY_CREATED,
        description: `Created activity: ${newActivity.activityType} for user ${newActivity.userId} (Super Admin)`,
        metadata: { 
          activityId: newActivity._id, 
          activityType: newActivity.activityType,
          targetUserId: newActivity.userId 
        },
        ...clientInfo
      });

      return NextResponse.json(
        { success: true, data: newActivity },
        { status: 201 }
      );
    }

    // Admin and Manager roles need specific permissions
    if (currentUser.role === "admin" || currentUser.role === "manager") {
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
      
      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.ACTIVITY_CREATED,
        description: `Created activity: ${newActivity.activityType} for user ${newActivity.userId} (${currentUser.role})`,
        metadata: { 
          activityId: newActivity._id, 
          activityType: newActivity.activityType,
          targetUserId: newActivity.userId 
        },
        ...clientInfo
      });

      return NextResponse.json(
        { success: true, data: newActivity },
        { status: 201 }
      );
    }

    // For all other roles, deny access
    return NextResponse.json(
      { success: false, error: "Access denied" },
      { status: 403 }
    );
  } catch (error: any) {
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
} 