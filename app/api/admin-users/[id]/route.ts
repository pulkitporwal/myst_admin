import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { AdminUser } from "@/models/AdminUser";
import { getCurrentUserWithPermissions } from "@/lib/getCurrentUserWithPermissions";
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
    const adminUser = await AdminUser.findById(id, { password: 0 }).populate(
      "permissions"
    );

    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: "Admin user not found" },
        { status: 404 }
      );
    }

    // Log activity
    await logActivity({
      userId: permissionCheck.user._id.toString(),
      activityType: ActivityTypes.ACTIVITY_VIEWED,
      description: `Viewed admin user details: ${adminUser.fullName}`,
      metadata: { adminUserId: adminUser._id },
      ...getClientInfo(request)
    });

    return NextResponse.json({ success: true, data: adminUser });
  } catch (error) {
    console.error("Error fetching admin user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch admin user" },
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
    const adminUser = await AdminUser.findById(id);

    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: "Admin user not found" },
        { status: 404 }
      );
    }

    // Update the admin user
    const updatedAdminUser = await AdminUser.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    ).select("-password");

    // Log activity
    await logActivity({
      userId: permissionCheck.user._id.toString(),
      activityType: ActivityTypes.ADMIN_USER_UPDATED,
      description: `Updated admin user: ${updatedAdminUser.fullName}`,
      metadata: { 
        adminUserId: updatedAdminUser._id,
        updatedFields: Object.keys(body)
      },
      ...getClientInfo(request)
    });

    return NextResponse.json({ success: true, data: updatedAdminUser });
  } catch (error: any) {
    console.error("Error updating admin user:", error);
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
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        createAnyPermissionErrorResponse(["USER_DELETE", "SUPER_ADMIN"], permissionCheck.permissions),
        { status: 403 }
      );
    }

    const { id } = await params;
    const adminUser = await AdminUser.findById(id);

    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: "Admin user not found" },
        { status: 404 }
      );
    }

    // Prevent deleting self
    if (adminUser._id.toString() === permissionCheck.user._id.toString()) {
      return NextResponse.json(
        { success: false, error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    await AdminUser.findByIdAndDelete(id);

    // Log activity
    await logActivity({
      userId: permissionCheck.user._id.toString(),
      activityType: ActivityTypes.ADMIN_USER_DELETED,
      description: `Deleted admin user: ${adminUser.fullName}`,
      metadata: { 
        adminUserId: adminUser._id,
        adminUserEmail: adminUser.email
      },
      ...getClientInfo(request)
    });

    return NextResponse.json({ success: true, message: "Admin user deleted successfully" });
  } catch (error) {
    console.error("Error deleting admin user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete admin user" },
      { status: 500 }
    );
  }
} 