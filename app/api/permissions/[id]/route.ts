import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { Permission } from "@/models/Permission";
import { checkAnyPermission, createAnyPermissionErrorResponse } from "@/lib/checkPermissions";
import { ActivityTypes, getClientInfo, logActivity } from "@/lib/activityLogger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const permission = await Permission.findById(id);

    if (!permission) {
      return NextResponse.json(
        { success: false, error: "Permission not found" },
        { status: 404 }
      );
    }

    // Log activity
    await logActivity({
      userId: permissionCheck.user._id.toString(),
      activityType: ActivityTypes.ACTIVITY_VIEWED,
      description: `Viewed permission details: ${permission.name}`,
      metadata: { permissionId: permission._id },
      ...getClientInfo(request)
    });

    return NextResponse.json({ success: true, data: permission });
  } catch (error) {
    console.error("Error fetching permission:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch permission" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const permission = await Permission.findById(id);

    if (!permission) {
      return NextResponse.json(
        { success: false, error: "Permission not found" },
        { status: 404 }
      );
    }

    // Update the permission
    const updatedPermission = await Permission.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    // Log activity
    await logActivity({
      userId: permissionCheck.user._id.toString(),
      activityType: ActivityTypes.PERMISSION_UPDATED,
      description: `Updated permission: ${updatedPermission.name}`,
      metadata: { 
        permissionId: updatedPermission._id,
        updatedFields: Object.keys(body)
      },
      ...getClientInfo(request)
    });

    return NextResponse.json({ success: true, data: updatedPermission });
  } catch (error: any) {
    console.error("Error updating permission:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    // Permission check - USER_DELETE or SUPER_ADMIN
    const permissionCheck = await checkAnyPermission(["USER_DELETE", "SUPER_ADMIN"]);

    console.log(permissionCheck)
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        createAnyPermissionErrorResponse(["USER_DELETE", "SUPER_ADMIN"], permissionCheck.permissions),
        { status: 403 }
      );
    }

    const { id } = await params;
    const permission = await Permission.findById(id);

    if (!permission) {
      return NextResponse.json(
        { success: false, error: "Permission not found" },
        { status: 404 }
      );
    }

    await Permission.findByIdAndDelete(id);

    // Log activity
    await logActivity({
      userId: permissionCheck.user._id.toString(),
      activityType: ActivityTypes.PERMISSION_DELETED,
      description: `Deleted permission: ${permission.name}`,
      metadata: { 
        permissionId: permission._id,
        permissionName: permission.name
      },
      ...getClientInfo(request)
    });

    return NextResponse.json({ success: true, message: "Permission deleted successfully" });
  } catch (error) {
    console.error("Error deleting permission:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete permission" },
      { status: 500 }
    );
  }
} 