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

export async function GET(request: Request) {
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

    console.log(permissionCheck.user);

    let content = [];
    if (permissionCheck.user.role !== "super-admin") {
      const finalAssignedUsers = await UserModel.distinct("_id", {
        assignedTo: permissionCheck.user._id,
      });

      console.log(finalAssignedUsers);

      if (finalAssignedUsers.length > 0) {
        content = await ContentModel.find({
          user_id: { $in: finalAssignedUsers },
        })
          .sort({ createdAt: -1 })
          .populate("user_id", "userName fullName avatarURL");
      }
    } else {
      content = await ContentModel.find({})
        .sort({ createdAt: -1 })
        .populate("user_id", "userName fullName avatarURL");
    }

    // Log activity
    await logActivity({
      userId: permissionCheck.user._id.toString(),
      activityType: ActivityTypes.ACTIVITY_VIEWED,
      description: "Viewed content list",
      metadata: { count: content?.length },
      ...getClientInfo(request),
    });

    return NextResponse.json({ success: true, data: content });
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

    // Permission check - CONTENT_CREATE_ALL_USER, CONTENT_CREATE_ASSIGNED_USER, or SUPER_ADMIN
    const permissionCheck = await checkAnyPermission([
      "CONTENT_CREATE_ALL_USER",
      "CONTENT_CREATE_ASSIGNED_USER",
      "SUPER_ADMIN",
    ]);
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        createAnyPermissionErrorResponse(
          ["CONTENT_CREATE_ALL_USER", "CONTENT_CREATE_ASSIGNED_USER", "SUPER_ADMIN"],
          permissionCheck.permissions
        ),
        { status: 403 }
      );
    }

    const body = await request.json();
    const { user_id, ...contentData } = body;

    // If user has CONTENT_CREATE_ASSIGNED_USER permission, validate they can create content for this user
    if (permissionCheck.user.role !== "super-admin" && 
        permissionCheck.permissions.includes("CONTENT_CREATE_ASSIGNED_USER") &&
        !permissionCheck.permissions.includes("CONTENT_CREATE_ALL_USER")) {
      
      // Check if the user is assigned to the current admin
      const assignedUser = await UserModel.findOne({
        _id: user_id,
        assignedTo: permissionCheck.user._id,
      });

      if (!assignedUser) {
        return NextResponse.json(
          { 
            success: false, 
            error: "You can only create content for users assigned to you",
            details: {
              requiredPermission: "CONTENT_CREATE_ASSIGNED_USER",
              userPermissions: permissionCheck.permissions,
              message: "The specified user is not assigned to you for content management."
            }
          },
          { status: 403 }
        );
      }
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

    // Log activity
    await logActivity({
      userId: permissionCheck.user._id.toString(),
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
  } catch (error: any) {
    console.error("Error creating content:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
