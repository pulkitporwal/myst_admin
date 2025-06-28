import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import "@/models/Interests"; 
import { UserModel } from "@/models/User"; 
import { checkAnyPermission, createAnyPermissionErrorResponse } from "@/lib/checkPermissions";
import { ActivityTypes, getClientInfo, logActivity } from "@/lib/activityLogger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ adminId: string }> }
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

    const { adminId } = await params;

    const assignedUsers = await UserModel.find({ assignedTo: adminId })
      .populate("interestIn", "interest description")
      .sort({ createdAt: -1 });

    // Log activity
    await logActivity({
      userId: permissionCheck.user._id.toString(),
      activityType: ActivityTypes.ACTIVITY_VIEWED,
      description: `Viewed users assigned to admin ${adminId}`,
      metadata: { 
        adminId: adminId,
        count: assignedUsers.length
      },
      ...getClientInfo(request)
    });

    return NextResponse.json({ success: true, data: assignedUsers });
  } catch (error) {
    console.error("Error fetching assigned users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch assigned users" },
      { status: 500 }
    );
  }
} 