import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import "@/models/Interests";
import { UserModel } from "@/models/User";
import { getCurrentUserWithPermissions } from "@/lib/getCurrentUserWithPermissions";
import { checkAnyPermission, createAnyPermissionErrorResponse } from "@/lib/checkPermissions";
import { ActivityTypes, getClientInfo, logActivity } from "@/lib/activityLogger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ adminId: string }> }
) {
  try {
    await dbConnect();

    // 1️⃣ Get current user
    const currentUser = await getCurrentUserWithPermissions();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { adminId } = await params;

    // 2️⃣ Super Admin: allow viewing any admin's assigned users
    if (currentUser.role === "super-admin") {
      const assignedUsers = await UserModel.find({ assignedTo: adminId })
        .populate("interestIn", "interest description")
        .sort({ createdAt: -1 });

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.ACTIVITY_VIEWED,
        description: `Viewed users assigned to admin ${adminId} (Super Admin)`,
        metadata: {
          adminId,
          count: assignedUsers.length
        },
        ...getClientInfo(request)
      });

      return NextResponse.json({ success: true, data: assignedUsers });
    }

    // 3️⃣ Admin: must have USER_VIEW, can view any admin's assigned users
    if (currentUser.role === "admin") {
      const permissionCheck = await checkAnyPermission(["USER_VIEW"]);
      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          createAnyPermissionErrorResponse(["USER_VIEW"], permissionCheck.permissions),
          { status: 403 }
        );
      }

      const assignedUsers = await UserModel.find({ assignedTo: adminId })
        .populate("interestIn", "interest description")
        .sort({ createdAt: -1 });

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.ACTIVITY_VIEWED,
        description: `Viewed users assigned to admin ${adminId} (Admin)`,
        metadata: {
          adminId,
          count: assignedUsers.length
        },
        ...getClientInfo(request)
      });

      return NextResponse.json({ success: true, data: assignedUsers });
    }

    // 4️⃣ Manager: must have USER_VIEW, but can ONLY view users assigned to themselves
    if (currentUser.role === "manager") {
      const permissionCheck = await checkAnyPermission(["USER_VIEW"]);
      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          createAnyPermissionErrorResponse(["USER_VIEW"], permissionCheck.permissions),
          { status: 403 }
        );
      }

      if (adminId !== currentUser._id.toString()) {
        return NextResponse.json(
          { success: false, error: "Access denied: managers can only view their own assigned users." },
          { status: 403 }
        );
      }

      const assignedUsers = await UserModel.find({ assignedTo: currentUser._id })
        .populate("interestIn", "interest description")
        .sort({ createdAt: -1 });

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.ACTIVITY_VIEWED,
        description: "Viewed users assigned to self (Manager)",
        metadata: {
          adminId: currentUser._id.toString(),
          count: assignedUsers.length
        },
        ...getClientInfo(request)
      });

      return NextResponse.json({ success: true, data: assignedUsers });
    }

    // 5️⃣ All other roles: deny
    return NextResponse.json(
      { success: false, error: "Access denied" },
      { status: 403 }
    );
  } catch (error) {
    console.error("Error fetching assigned users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch assigned users" },
      { status: 500 }
    );
  }
}
