import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import "@/models/Interests"; 
import { UserModel } from "@/models/User"; 
import { checkAnyPermission, createAnyPermissionErrorResponse } from "@/lib/checkPermissions";
import { ActivityTypes, getClientInfo, logActivity } from "@/lib/activityLogger";

export async function GET(request: Request) {
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

    // Find users who are not assigned to any admin (assignedTo is null, undefined, or doesn't exist)
    const unassignedUsers = await UserModel.find({
      $or: [
        { assignedTo: { $exists: false } },
        { assignedTo: null },
        { assignedTo: undefined }
      ]
    })
    .populate("interestIn", "interest description")
    .sort({ createdAt: -1 });

    // Log activity
    await logActivity({
      userId: permissionCheck.user._id.toString(),
      activityType: ActivityTypes.ACTIVITY_VIEWED,
      description: "Viewed unassigned users list",
      metadata: { count: unassignedUsers.length },
      ...getClientInfo(request)
    });

    return NextResponse.json({ success: true, data: unassignedUsers });
  } catch (error) {
    console.error("Error fetching unassigned users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch unassigned users" },
      { status: 500 }
    );
  }
} 