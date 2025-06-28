import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import {
  checkAnyPermission,
  createAnyPermissionErrorResponse,
} from "@/lib/checkPermissions";
import {
  ActivityTypes,
  getClientInfo,
  logActivity,
} from "@/lib/activityLogger";
import { ContentModel } from "@/models/Content";
import { UserModel } from "@/models/User";
import { InterestModel } from "@/models/Interests";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await dbConnect();

    // Permission check - CONTENT_VIEW or SUPER_ADMIN
    const permissionCheck = await checkAnyPermission([
      "CONTENT_VIEW",
      "SUPER_ADMIN",
    ]);
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        createAnyPermissionErrorResponse(
          ["CONTENT_VIEW", "SUPER_ADMIN"],
          permissionCheck.permissions
        ),
        { status: 403 }
      );
    }

    const { userId } = await params;

    // If user is not super-admin, check if they can view content for this user
    if (permissionCheck.user.role !== "super-admin") {
      // Check if the user is assigned to the current admin
      const assignedUser = await UserModel.findOne({
        _id: userId,
        assignedTo: permissionCheck.user._id,
      });

      if (!assignedUser) {
        return NextResponse.json(
          { 
            success: false, 
            error: "You can only view content for users assigned to you",
            details: {
              requiredPermission: "CONTENT_VIEW",
              userPermissions: permissionCheck.permissions,
              message: "The specified user is not assigned to you for content management."
            }
          },
          { status: 403 }
        );
      }
    }

    InterestModel.modelName
    
    const user = await UserModel.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch content for the specific user
    const content = await ContentModel.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .populate("user_id", "userName fullName avatarURL")
      .populate("category", "interest description");
      

    // Log activity
    await logActivity({
      userId: permissionCheck.user._id.toString(),
      activityType: ActivityTypes.ACTIVITY_VIEWED,
      description: `Viewed content for user: ${user.fullName}`,
      metadata: { 
        count: content?.length,
        targetUserId: userId,
        targetUserName: user.fullName,
      },
      ...getClientInfo(request),
    });

    return NextResponse.json({ success: true, data: content });
  } catch (error) {
    console.error("Error fetching user content:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user content" },
      { status: 500 }
    );
  }
} 