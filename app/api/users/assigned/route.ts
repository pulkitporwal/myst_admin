import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import "@/models/Interests";
import { UserModel } from "@/models/User";
import { getCurrentUserWithPermissions } from "@/lib/getCurrentUserWithPermissions";
import { checkAnyPermission, createPermissionErrorResponse } from "@/lib/checkPermissions";
import { ActivityTypes, getClientInfo, logActivity } from "@/lib/activityLogger";

export async function GET(request: Request) {
  try {
    await dbConnect();

    // 1️⃣ Get current user
    const currentUser = await getCurrentUserWithPermissions();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, msg: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2️⃣ Super Admin: no permission needed, return all users
    if (currentUser.role === "super-admin") {
      const users = await UserModel.find(
        { isActive: true },
        { password: 0, fcmToken: 0 }
      )
        .sort({ createdAt: -1 })
        .populate("interestIn", "interest description")
        .populate("assignedTo", "fullName email role");

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.ACTIVITY_VIEWED,
        description: "Viewed all users list (Super Admin)",
        metadata: {
          count: users.length,
        },
        ...getClientInfo(request),
      });

      return NextResponse.json(
        { success: true, msg: "All Active Users Fetched", data: users },
        { status: 200 }
      );
    }

    // 3️⃣ Admin: must have USER_VIEW to view all active users
    if (currentUser.role === "admin") {
      const permissionCheck = await checkAnyPermission(["USER_VIEW"]);
      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          createPermissionErrorResponse("USER_VIEW", permissionCheck.permissions),
          { status: 403 }
        );
      }

      const users = await UserModel.find(
        { isActive: true },
        { password: 0, fcmToken: 0 }
      )
        .sort({ createdAt: -1 })
        .populate("interestIn", "interest description")
        .populate("assignedTo", "fullName email role");

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.ACTIVITY_VIEWED,
        description: "Viewed all users list (Admin)",
        metadata: {
          count: users.length,
        },
        ...getClientInfo(request),
      });

      return NextResponse.json(
        { success: true, msg: "All Active Users Fetched", data: users },
        { status: 200 }
      );
    }

    // 4️⃣ Manager: must have USER_VIEW, but only see assigned users
    if (currentUser.role === "manager") {
      const permissionCheck = await checkAnyPermission(["USER_VIEW"]);
      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          createPermissionErrorResponse("USER_VIEW", permissionCheck.permissions),
          { status: 403 }
        );
      }

      const users = await UserModel.find(
        {
          isActive: true,
          assignedTo: currentUser._id,
        },
        { password: 0, fcmToken: 0 }
      )
        .sort({ createdAt: -1 })
        .populate("interestIn", "interest description")
        .populate("assignedTo", "fullName email role");

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.ACTIVITY_VIEWED,
        description: "Viewed assigned users list (Manager)",
        metadata: {
          count: users.length,
        },
        ...getClientInfo(request),
      });

      return NextResponse.json(
        { success: true, msg: "Assigned Active Users Fetched", data: users },
        { status: 200 }
      );
    }

    // 5️⃣ All other roles: deny access
    return NextResponse.json(
      { success: false, msg: "Access denied" },
      { status: 403 }
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
