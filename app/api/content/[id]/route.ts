import { NextResponse } from "next/server";
import "@/models/Interests";
import { dbConnect } from "@/lib/dbConnect";
import { ContentModel } from "@/models/Content";
import {
  checkAnyPermission,
  createAnyPermissionErrorResponse,
} from "@/lib/checkPermissions";
import {
  ActivityTypes,
  getClientInfo,
  logActivity,
} from "@/lib/activityLogger";
import { InterestModel } from "@/models/Interests";
import { getCurrentUserWithPermissions } from "@/lib/getCurrentUserWithPermissions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    // Get current user
    const currentUser = await getCurrentUserWithPermissions();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only super-admin, admin, manager allowed
    if (!["super-admin", "admin", "manager"].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Super-admin skips permission checks
    if (currentUser.role !== "super-admin") {
      const permissionCheck = await checkAnyPermission(["CONTENT_VIEW"]);
      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          createAnyPermissionErrorResponse(["CONTENT_VIEW"], permissionCheck.permissions),
          { status: 403 }
        );
      }
    }

    const { id } = await params;

    // Find content
    const content = await ContentModel.findById(id)
      .populate("user_id", "fullName userName avatarURL assignedTo")
      .populate("category", "interest description");

      console.log(content)

    if (!content) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }

    // Manager-specific check: can only view content assigned to themselves
    if (currentUser.role === "manager") {
      const assignedToId = content.user_id?.assignedTo?.toString();
      if (assignedToId !== currentUser._id.toString()) {
        return NextResponse.json(
          {
            success: false,
            error: "Managers can only view content of users assigned to them."
          },
          { status: 403 }
        );
      }
    }

    // Log activity
    await logActivity({
      userId: currentUser._id.toString(),
      activityType: ActivityTypes.ACTIVITY_VIEWED,
      description: `Viewed content details: ${content.title || content._id}`,
      metadata: { contentId: content._id },
      ...getClientInfo(request),
    });

    return NextResponse.json(
      { success: true, data: content },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching content:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}


export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    // Permission check - CONTENT_UPDATE_ALL_USER or SUPER_ADMIN
    const permissionCheck = await checkAnyPermission([
      "CONTENT_UPDATE_ALL_USER",
      "SUPER_ADMIN",
    ]);
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        createAnyPermissionErrorResponse(
          ["CONTENT_UPDATE_ALL_USER", "SUPER_ADMIN"],
          permissionCheck.permissions
        ),
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const updated = await ContentModel.findByIdAndUpdate(id, body, {
      new: true,
    })
      .populate("user_id", "fullName userName avatarURL")
      .populate("category", "interest description");
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }

    // Log activity
    await logActivity({
      userId: permissionCheck.user._id.toString(),
      activityType: ActivityTypes.CONTENT_UPDATED,
      description: `Updated content: ${updated.title || updated._id}`,
      metadata: {
        contentId: updated._id,
        updatedFields: Object.keys(body),
      },
      ...getClientInfo(request),
    });

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    console.error("Error updating content:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update content" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    // Permission check - CONTENT_DELETE_ALL_USER or SUPER_ADMIN
    const permissionCheck = await checkAnyPermission([
      "CONTENT_DELETE_ALL_USER",
      "SUPER_ADMIN",
    ]);
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        createAnyPermissionErrorResponse(
          ["CONTENT_DELETE_ALL_USER", "SUPER_ADMIN"],
          permissionCheck.permissions
        ),
        { status: 403 }
      );
    }

    const { id } = await params;
    const deleted = await ContentModel.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }

    // Log activity
    await logActivity({
      userId: permissionCheck.user._id.toString(),
      activityType: ActivityTypes.CONTENT_DELETED,
      description: `Deleted content: ${deleted.title || deleted._id}`,
      metadata: {
        contentId: deleted._id,
        contentType: deleted.type,
      },
      ...getClientInfo(request),
    });

    return NextResponse.json(
      { success: true, message: "Content deleted" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting content:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete content" },
      { status: 500 }
    );
  }
}
