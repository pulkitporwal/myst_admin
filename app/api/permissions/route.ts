import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { Permission } from "@/models/Permission";
import { checkAnyPermission, createAnyPermissionErrorResponse } from "@/lib/checkPermissions";
import { ActivityTypes, getClientInfo, logActivity } from "@/lib/activityLogger";

export async function GET(request: Request) {
  try {
    await dbConnect();

    // Permission check - ADMIN_USER_VIEW or SUPER_ADMIN
    const permissionCheck = await checkAnyPermission(["ADMIN_USER_VIEW", "SUPER_ADMIN"]);
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        createAnyPermissionErrorResponse(["ADMIN_USER_VIEW", "SUPER_ADMIN"], permissionCheck.permissions),
        { status: 403 }
      );
    }

    const permissions = await Permission.find({}).sort({ name: 1 });

    // Log activity
    await logActivity({
      userId: permissionCheck.user._id.toString(),
      activityType: ActivityTypes.ACTIVITY_VIEWED,
      description: "Viewed permissions list",
      metadata: { count: permissions.length },
      ...getClientInfo(request)
    });

    return NextResponse.json({ success: true, data: permissions });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    // Permission check - USER_UPDATE or SUPER_ADMIN
    const permissionCheck = await checkAnyPermission(["USER_UPDATE", "SUPER_ADMIN"]);
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        createAnyPermissionErrorResponse(["USER_UPDATE", "SUPER_ADMIN"], permissionCheck.permissions),
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    // Check if permission already exists
    const existingPermission = await Permission.findOne({ name });
    if (existingPermission) {
      return NextResponse.json(
        { success: false, error: "Permission with this name already exists" },
        { status: 409 }
      );
    }

    const newPermission = await Permission.create({ name, description });

    // Log activity
    await logActivity({
      userId: permissionCheck.user._id.toString(),
      activityType: ActivityTypes.PERMISSION_CREATED,
      description: `Created permission: ${newPermission.name}`,
      metadata: { 
        permissionId: newPermission._id,
        permissionName: newPermission.name
      },
      ...getClientInfo(request)
    });

    return NextResponse.json(
      { success: true, data: newPermission },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating permission:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
} 