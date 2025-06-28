import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import "@/models/Interests"; 
import { UserModel } from "@/models/User"; 
import { getCurrentUserWithPermissions } from "@/lib/getCurrentUserWithPermissions";
import { checkPermission, createPermissionErrorResponse } from "@/lib/checkPermissions";
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

    // Permission check - empty array for manual permission assignment
    const permissionCheck = await checkPermission("USER_VIEW_ASSIGNED");
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        createPermissionErrorResponse("VIEW_ASSIGNED_USERS", permissionCheck.permissions),
        { status: 403 }
      );
    }

    // Only managers and admins can access their assigned users
    if (!["admin", "manager"].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const users = await UserModel.find(
      { 
        isActive: true,
        assignedTo: currentUser._id 
      },
      {
        password: 0,
        fcmToken: 0,
      }
    )
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
        adminRole: currentUser.role
      },
      ...getClientInfo(request)
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