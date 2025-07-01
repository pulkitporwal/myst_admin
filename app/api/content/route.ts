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
import { getCurrentUserWithPermissions } from "@/lib/getCurrentUserWithPermissions";
import { InterestModel } from "@/models/Interests";

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

    InterestModel.modelName

    if (currentUser.role === "super-admin") {
      const content = await ContentModel.find({})
        .sort({ createdAt: -1 })
        .populate("user_id", "userName fullName avatarURL").populate("category", "interest");



      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.ACTIVITY_VIEWED,
        description: "Viewed all content (Super Admin)",
        metadata: { count: content?.length },
        ...getClientInfo(request),
      });

      return NextResponse.json({ success: true, data: content });
    }

    if (currentUser.role === "admin") {
      const permissionCheck = await checkAnyPermission(["CONTENT_VIEW"]);
      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          createAnyPermissionErrorResponse(
            ["CONTENT_VIEW"],
            permissionCheck.permissions
          ),
          { status: 403 }
        );
      }

      const content = await ContentModel.find({})
        .sort({ createdAt: -1 })
        .populate("user_id", "userName fullName avatarURL");

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.ACTIVITY_VIEWED,
        description: "Viewed all content (Admin)",
        metadata: { count: content?.length },
        ...getClientInfo(request),
      });

      return NextResponse.json({ success: true, data: content });
    }

    if (currentUser.role === "manager") {
      const permissionCheck = await checkAnyPermission(["CONTENT_VIEW"]);
      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          createAnyPermissionErrorResponse(
            ["CONTENT_VIEW"],
            permissionCheck.permissions
          ),
          { status: 403 }
        );
      }

      const finalAssignedUsers = await UserModel.distinct("_id", {
        assignedTo: currentUser._id,
      });

      let content: any[] = [];
      if (finalAssignedUsers.length > 0) {
        content = await ContentModel.find({
          user_id: { $in: finalAssignedUsers },
        })
          .sort({ createdAt: -1 })
          .populate("user_id", "userName fullName avatarURL");
      }

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.ACTIVITY_VIEWED,
        description: "Viewed assigned content (Manager)",
        metadata: { count: content?.length },
        ...getClientInfo(request),
      });

      return NextResponse.json({ success: true, data: content });
    }

    // 4️⃣ For all other roles, deny access
    return NextResponse.json(
      { success: false, error: "Access denied" },
      { status: 403 }
    );
  } catch (error) {
    console.error("Error fetching content:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    // 2️⃣ Parse request body
    const body = await request.json();
    const { user_id, ...contentData } = body;

    // 3️⃣ Super Admin: allow all
    if (currentUser.role === "super-admin") {
      // Validate that the user exists
      const user = await UserModel.findById(user_id);
      if (!user) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      const newContent = await ContentModel.create({
        user_id,
        ...contentData,
      });

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.CONTENT_CREATED,
        description: `Created content for user: ${user.fullName}`,
        metadata: {
          contentId: newContent._id,
          contentType: newContent.content_type,
          targetUserId: user_id,
          targetUserName: user.fullName,
        },
        ...getClientInfo(request),
      });

      return NextResponse.json(
        { success: true, data: newContent },
        { status: 201 }
      );
    }

    if (currentUser.role === "admin") {
      const permissionCheck = await checkAnyPermission(["CONTENT_CREATE"]);
      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          createAnyPermissionErrorResponse(
            ["CONTENT_CREATE_ALL_USER"],
            permissionCheck.permissions
          ),
          { status: 403 }
        );
      }

      // Validate that the user exists
      const user = await UserModel.findById(user_id);
      if (!user) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      const newContent = await ContentModel.create({
        user_id,
        ...contentData,
      });

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.CONTENT_CREATED,
        description: `Created content for user: ${user.fullName}`,
        metadata: {
          contentId: newContent._id,
          contentType: newContent.content_type,
          targetUserId: user_id,
          targetUserName: user.fullName,
        },
        ...getClientInfo(request),
      });

      return NextResponse.json(
        { success: true, data: newContent },
        { status: 201 }
      );
    }

    // 5️⃣ Manager: must have CONTENT_CREATE_ASSIGNED_USER and validate assigned user
    if (currentUser.role === "manager") {
      const permissionCheck = await checkAnyPermission(["CONTENT_CREATE"]);
      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          createAnyPermissionErrorResponse(
            ["CONTENT_CREATE_ASSIGNED_USER"],
            permissionCheck.permissions
          ),
          { status: 403 }
        );
      }

      // Check if the target user is assigned to this manager
      const assignedUser = await UserModel.findOne({
        _id: user_id,
        assignedTo: currentUser._id,
      });

      if (!assignedUser) {
        return NextResponse.json(
          {
            success: false,
            error: "You can only create content for users assigned to you.",
          },
          { status: 403 }
        );
      }

      const newContent = await ContentModel.create({
        user_id,
        ...contentData,
      });

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.CONTENT_CREATED,
        description: `Created content for assigned user: ${assignedUser.fullName}`,
        metadata: {
          contentId: newContent._id,
          contentType: newContent.content_type,
          targetUserId: user_id,
          targetUserName: assignedUser.fullName,
        },
        ...getClientInfo(request),
      });

      return NextResponse.json(
        { success: true, data: newContent },
        { status: 201 }
      );
    }

    // 6️⃣ All other roles: deny access
    return NextResponse.json(
      { success: false, error: "Access denied" },
      { status: 403 }
    );
  } catch (error: any) {
    console.error("Error creating content:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
