import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { getCurrentUserWithPermissions } from "@/lib/getCurrentUserWithPermissions";
import { checkAnyPermission, createAnyPermissionErrorResponse } from "@/lib/checkPermissions";
import { ActivityTypes, getClientInfo, logActivity } from "@/lib/activityLogger";
import { UserModel } from "@/models/User";

// ✅ GET - View a user profile
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const currentUser = await getCurrentUserWithPermissions();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const user = await UserModel.findById(id).populate("interestIn", "interest description");
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Super-admin bypasses permission checks
    if (currentUser.role === "super-admin") {
      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.ACTIVITY_VIEWED,
        description: `Viewed user details: ${user.fullName}`,
        metadata: { userId: user._id },
        ...getClientInfo(request),
      });
      return NextResponse.json({ success: true, data: user });
    }

    // Admin: must have USER_VIEW
    if (currentUser.role === "admin") {
      const permissionCheck = await checkAnyPermission(["USER_VIEW"]);
      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          createAnyPermissionErrorResponse(["USER_VIEW"], permissionCheck.permissions),
          { status: 403 }
        );
      }
      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.ACTIVITY_VIEWED,
        description: `Viewed user details: ${user.fullName} (Admin)`,
        metadata: { userId: user._id },
        ...getClientInfo(request),
      });
      return NextResponse.json({ success: true, data: user });
    }

    // Manager: must have USER_VIEW and can only view assigned users
    if (currentUser.role === "manager") {
      const permissionCheck = await checkAnyPermission(["USER_VIEW"]);
      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          createAnyPermissionErrorResponse(["USER_VIEW"], permissionCheck.permissions),
          { status: 403 }
        );
      }
      if (user.assignedTo?.toString() !== currentUser._id.toString()) {
        return NextResponse.json(
          { success: false, error: "Access denied: Managers can only view their assigned users." },
          { status: 403 }
        );
      }
      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.ACTIVITY_VIEWED,
        description: `Viewed user details: ${user.fullName} (Manager)`,
        metadata: { userId: user._id },
        ...getClientInfo(request),
      });
      return NextResponse.json({ success: true, data: user });
    }

    return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// ✅ PUT - Update a user profile
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const currentUser = await getCurrentUserWithPermissions();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const user = await UserModel.findById(id);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const body = await request.json();

    if (currentUser.role === "super-admin") {
      const updatedUser = await UserModel.findByIdAndUpdate(
        id,
        { $set: body },
        { new: true, runValidators: true }
      );
      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.USER_UPDATED,
        description: `Updated user: ${updatedUser.fullName}`,
        metadata: { userId: updatedUser._id, updatedFields: Object.keys(body) },
        ...getClientInfo(request),
      });
      return NextResponse.json({ success: true, data: updatedUser });
    }

    if (currentUser.role === "admin") {
      const permissionCheck = await checkAnyPermission(["USER_UPDATE"]);
      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          createAnyPermissionErrorResponse(["USER_UPDATE"], permissionCheck.permissions),
          { status: 403 }
        );
      }
      const updatedUser = await UserModel.findByIdAndUpdate(
        id,
        { $set: body },
        { new: true, runValidators: true }
      );
      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.USER_UPDATED,
        description: `Updated user: ${updatedUser.fullName} (Admin)`,
        metadata: { userId: updatedUser._id, updatedFields: Object.keys(body) },
        ...getClientInfo(request),
      });
      return NextResponse.json({ success: true, data: updatedUser });
    }

    if (currentUser.role === "manager") {
      const permissionCheck = await checkAnyPermission(["USER_UPDATE"]);
      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          createAnyPermissionErrorResponse(["USER_UPDATE"], permissionCheck.permissions),
          { status: 403 }
        );
      }
      if (user.assignedTo?.toString() !== currentUser._id.toString()) {
        return NextResponse.json(
          { success: false, error: "Access denied: Managers can only update their assigned users." },
          { status: 403 }
        );
      }
      const updatedUser = await UserModel.findByIdAndUpdate(
        id,
        { $set: body },
        { new: true, runValidators: true }
      );
      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.USER_UPDATED,
        description: `Updated user: ${updatedUser.fullName} (Manager)`,
        metadata: { userId: updatedUser._id, updatedFields: Object.keys(body) },
        ...getClientInfo(request),
      });
      return NextResponse.json({ success: true, data: updatedUser });
    }

    return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

// ✅ DELETE - Delete a user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const currentUser = await getCurrentUserWithPermissions();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const user = await UserModel.findById(id);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (currentUser.role === "super-admin") {
      await UserModel.findByIdAndDelete(id);
      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.USER_DELETED,
        description: `Deleted user: ${user.fullName}`,
        metadata: { userId: user._id, userEmail: user.email },
        ...getClientInfo(request),
      });
      return NextResponse.json({ success: true, message: "User deleted successfully" });
    }

    if (currentUser.role === "admin") {
      const permissionCheck = await checkAnyPermission(["USER_DELETE"]);
      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          createAnyPermissionErrorResponse(["USER_DELETE"], permissionCheck.permissions),
          { status: 403 }
        );
      }
      await UserModel.findByIdAndDelete(id);
      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.USER_DELETED,
        description: `Deleted user: ${user.fullName} (Admin)`,
        metadata: { userId: user._id, userEmail: user.email },
        ...getClientInfo(request),
      });
      return NextResponse.json({ success: true, message: "User deleted successfully" });
    }

    if (currentUser.role === "manager") {
      const permissionCheck = await checkAnyPermission(["USER_DELETE"]);
      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          createAnyPermissionErrorResponse(["USER_DELETE"], permissionCheck.permissions),
          { status: 403 }
        );
      }
      if (user.assignedTo?.toString() !== currentUser._id.toString()) {
        return NextResponse.json(
          { success: false, error: "Access denied: Managers can only delete their assigned users." },
          { status: 403 }
        );
      }
      await UserModel.findByIdAndDelete(id);
      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.USER_DELETED,
        description: `Deleted user: ${user.fullName} (Manager)`,
        metadata: { userId: user._id, userEmail: user.email },
        ...getClientInfo(request),
      });
      return NextResponse.json({ success: true, message: "User deleted successfully" });
    }

    return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
