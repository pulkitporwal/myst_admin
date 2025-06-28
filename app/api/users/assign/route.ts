import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { UserModel } from "@/models/User";
import { AdminUser } from "@/models/AdminUser";
import { getCurrentUserWithPermissions } from "@/lib/getCurrentUserWithPermissions";
import { checkAnyPermission, createAnyPermissionErrorResponse } from "@/lib/checkPermissions";
import { ActivityTypes, getClientInfo, logActivity } from "@/lib/activityLogger";

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

    const { userId, adminUserId } = await request.json();

    if (!userId || !adminUserId) {
      return NextResponse.json(
        { success: false, error: "User ID and Admin User ID are required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Verify that the admin user exists
    const adminUser = await AdminUser.findById(adminUserId);
    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: "Admin user not found" },
        { status: 404 }
      );
    }

    // Update user assignment
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { assignedTo: adminUserId },
      { new: true }
    ).populate("assignedTo", "fullName email role");

    // Log activity
    await logActivity({
      userId: permissionCheck.user._id.toString(),
      activityType: ActivityTypes.USER_UPDATED,
      description: `Assigned user ${user.fullName} to admin`,
      metadata: { 
        userId: user._id,
        adminUserId: adminUserId,
        userEmail: user.email
      },
      ...getClientInfo(request)
    });

    return NextResponse.json({ 
      success: true, 
      data: updatedUser,
      message: "User assigned successfully" 
    });
  } catch (error: any) {
    console.error("Error assigning user:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
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

    // Get userId from query parameters instead of request body
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Verify that the user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Remove the assignment
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { assignedTo: null },
      { new: true }
    );

    // Log activity
    await logActivity({
      userId: permissionCheck.user._id.toString(),
      activityType: ActivityTypes.USER_UPDATED,
      description: `Unassigned user ${user.fullName} from admin`,
      metadata: { 
        userId: user._id,
        userEmail: user.email,
        action: "unassignment"
      },
      ...getClientInfo(request)
    });

    return NextResponse.json({ 
      success: true, 
      data: updatedUser,
      message: "User unassigned successfully" 
    });
  } catch (error: any) {
    console.error("Error unassigning user:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
} 