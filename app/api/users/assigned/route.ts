import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import "@/models/Interests";
import { UserModel } from "@/models/User";
import { getCurrentUserWithPermissions } from "@/lib/getCurrentUserWithPermissions";
import {  checkAnyPermission, createPermissionErrorResponse } from "@/lib/checkPermissions";
import { ActivityTypes, getClientInfo, logActivity } from "@/lib/activityLogger";

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

    // Permission check
    const permissionCheck = await checkAnyPermission([
      "USER_VIEW_ASSIGNED",
      "SUPER_ADMIN",
    ]);

    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        createPermissionErrorResponse(
          "VIEW_ASSIGNED_USERS",
          permissionCheck.permissions
        ),
        { status: 403 }
      );
    }

    // Only managers, admins, and super-admins can access
    if (!["admin", "manager", "super-admin"].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Build query condition
    let query: Record<string, any> = {
      isActive: true,
    };

    if (currentUser.role !== "super-admin") {
      // For admin/manager: only assigned users
      query.assignedTo = currentUser._id;
    }

    const users = await UserModel.find(query, {
      password: 0,
      fcmToken: 0,
    })
      .sort({ createdAt: -1 })
      .populate("interestIn", "interest description")
      .populate("assignedTo", "fullName email role");

    // Log activity
    await logActivity({
      userId: currentUser._id.toString(),
      activityType: ActivityTypes.ACTIVITY_VIEWED,
      description: "Viewed assigned users list",
      metadata: {
        count: users.length,
        adminRole: currentUser.role,
      },
      ...getClientInfo(request),
    });

    return NextResponse.json(
      {
        success: true,
        data: users,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching assigned users:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch assigned users",
      },
      { status: 500 }
    );
  }
}
