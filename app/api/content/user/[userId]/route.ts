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
import { getCurrentUserWithPermissions } from "@/lib/getCurrentUserWithPermissions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await dbConnect();

    const { userId } = await params;
    InterestModel.modelName;

    const currentUser = await getCurrentUserWithPermissions();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (currentUser.role === "super-admin") {
      const user = await UserModel.findById(userId);
      if (!user) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      const content = await ContentModel.find({ user_id: userId })
        .sort({ createdAt: -1 })
        .populate("user_id", "userName fullName avatarURL")
        .populate("category", "interest description");

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.ACTIVITY_VIEWED,
        description: `Viewed content for user: ${user.fullName} (Super Admin)`,
        metadata: {
          count: content?.length,
          targetUserId: userId,
          targetUserName: user.fullName,
        },
        ...getClientInfo(request),
      });

      return NextResponse.json({ success: true, data: content });
    }

    if (currentUser.role === "admin") {
      const permissionCheck = await checkAnyPermission(["CONTENT_VIEW"]);
      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          createAnyPermissionErrorResponse(["CONTENT_VIEW"], permissionCheck.permissions),
          { status: 403 }
        );
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      const content = await ContentModel.find({ user_id: userId })
        .sort({ createdAt: -1 })
        .populate("user_id", "userName fullName avatarURL")
        .populate("category", "interest description");

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.ACTIVITY_VIEWED,
        description: `Viewed content for user: ${user.fullName} (Admin)`,
        metadata: {
          count: content?.length,
          targetUserId: userId,
          targetUserName: user.fullName,
        },
        ...getClientInfo(request),
      });

      return NextResponse.json({ success: true, data: content });
    }

    // Manager: must have CONTENT_VIEW, can only view assigned users
    if (currentUser.role === "manager") {
      const permissionCheck = await checkAnyPermission(["CONTENT_VIEW"]);
      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          createAnyPermissionErrorResponse(["CONTENT_VIEW"], permissionCheck.permissions),
          { status: 403 }
        );
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      if (user.assignedTo?.toString() !== currentUser._id.toString()) {
        return NextResponse.json(
          {
            success: false,
            error: "Access denied: Managers can only view content for users assigned to them.",
          },
          { status: 403 }
        );
      }

      const content = await ContentModel.find({ user_id: userId })
        .sort({ createdAt: -1 })
        .populate("user_id", "userName fullName avatarURL")
        .populate("category", "interest description");

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.ACTIVITY_VIEWED,
        description: `Viewed content for user: ${user.fullName} (Manager)`,
        metadata: {
          count: content?.length,
          targetUserId: userId,
          targetUserName: user.fullName,
        },
        ...getClientInfo(request),
      });

      return NextResponse.json({ success: true, data: content });
    }

    // All other roles: deny access
    return NextResponse.json(
      { success: false, error: "Access denied" },
      { status: 403 }
    );
  } catch (error) {
    console.error("Error fetching user content:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user content" },
      { status: 500 }
    );
  }
}
