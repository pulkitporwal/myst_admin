import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { checkAnyPermission, createAnyPermissionErrorResponse } from "@/lib/checkPermissions";
import { ActivityTypes, getClientInfo, logActivity } from "@/lib/activityLogger";
import { UserModel } from "@/models/User";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    // Permission check - USER_PROFILE_VIEW or SUPER_ADMIN
    const permissionCheck = await checkAnyPermission(["USER_PROFILE_VIEW", "SUPER_ADMIN"]);
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        createAnyPermissionErrorResponse(["USER_PROFILE_VIEW", "SUPER_ADMIN"], permissionCheck.permissions),
        { status: 403 }
      );
    }

    const { id } = await params;
    const user = await UserModel.findById(id).populate("interestIn", "interest description");

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Log activity
    await logActivity({
      userId: permissionCheck.user._id.toString(),
      activityType: ActivityTypes.ACTIVITY_VIEWED,
      description: `Viewed user details: ${user.fullName}`,
      metadata: { userId: user._id },
      ...getClientInfo(request)
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user" },
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
    const user = await UserModel.findById(id);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Update the user
    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    // Log activity
    await logActivity({
      userId: permissionCheck.user._id.toString(),
      activityType: ActivityTypes.USER_UPDATED,
      description: `Updated user: ${updatedUser.fullName}`,
      metadata: { 
        userId: updatedUser._id,
        updatedFields: Object.keys(body)
      },
      ...getClientInfo(request)
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error: any) {
    console.error("Error updating user:", error);
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
    const user = await UserModel.findById(id);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    await UserModel.findByIdAndDelete(id);

    // Log activity
    await logActivity({
      userId: permissionCheck.user._id.toString(),
      activityType: ActivityTypes.USER_DELETED,
      description: `Deleted user: ${user.fullName}`,
      metadata: { 
        userId: user._id,
        userEmail: user.email
      },
      ...getClientInfo(request)
    });

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete user" },
      { status: 500 }
    );
  }
}

