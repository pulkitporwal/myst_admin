import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { ActivityModel } from "@/models/Activities";
import { logActivity, ActivityTypes, getClientInfo } from "@/lib/activityLogger";
import { getCurrentUserWithPermissions } from "@/lib/getCurrentUserWithPermissions";
import { checkPermission, createPermissionErrorResponse } from "@/lib/checkPermissions";
import { checkAnyPermission, createAnyPermissionErrorResponse } from "@/lib/checkPermissions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    // Permission check - ACTIVITIES_VIEW or SUPER_ADMIN
    const permissionCheck = await checkAnyPermission(["ACTIVITIES_VIEW", "SUPER_ADMIN"]);
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        createAnyPermissionErrorResponse(["ACTIVITIES_VIEW", "SUPER_ADMIN"], permissionCheck.permissions),
        { status: 403 }
      );
    }

    const { id } = await params;
    const activity = await ActivityModel.findById(id);

    if (!activity) {
      return NextResponse.json(
        { success: false, error: "Activity not found" },
        { status: 404 }
      );
    }

    // Log activity
    await logActivity({
      userId: permissionCheck.user._id.toString(),
      activityType: ActivityTypes.ACTIVITY_VIEWED,
      description: `Viewed activity details: ${activity._id}`,
      metadata: { activityId: activity._id },
      ...getClientInfo(request)
    });

    return NextResponse.json({ success: true, data: activity });
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: any) {
  try {
    // Check permission - you can change this to your custom permission name
    const permissionCheck = await checkAnyPermission(["ACTIVITY_UPDATE","SUPER_ADMIN"]);
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        createPermissionErrorResponse("ACTIVITY_UPDATE", permissionCheck.permissions),
        { status: 403 }
      );
    }

    await dbConnect();
    const body = await request.json();
    
    // Get the original activity for logging
    const originalActivity = await ActivityModel.findById(params.id);
    if (!originalActivity) {
      return NextResponse.json(
        { success: false, error: "Activity not found" },
        { status: 404 }
      );
    }
    
    // Remove fields that shouldn't be updated
    const { userId, createdAt, ...updateData } = body;
    
    const updatedActivity = await ActivityModel.findByIdAndUpdate(
      params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).populate('userId', 'fullName userName avatarURL');

    if (!updatedActivity) {
      return NextResponse.json(
        { success: false, error: "Activity not found" },
        { status: 404 }
      );
    }

    // Log activity update
    const clientInfo = getClientInfo(request);
    
    if (permissionCheck.user?._id) {
      await logActivity({
        userId: permissionCheck.user._id.toString(),
        activityType: ActivityTypes.ACTIVITY_UPDATED,
        description: `Updated activity: ${updatedActivity.activityType}`,
        metadata: { 
          activityId: updatedActivity._id, 
          activityType: updatedActivity.activityType,
          targetUserId: updatedActivity.userId,
          changes: updateData
        },
        ...clientInfo
      });
    }

    return NextResponse.json({ success: true, data: updatedActivity });
  } catch (error: any) {
    console.error("Error updating activity:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, { params }: any) {
  try {
    // Check permission - you can change this to your custom permission name
    const permissionCheck = await checkAnyPermission(["ACTIVITY_DELETE","SUPER_ADMIN"]);
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        createPermissionErrorResponse("ACTIVITY_DELETE", permissionCheck.permissions),
        { status: 403 }
      );
    }

    await dbConnect();
    
    // Get the activity before deleting for logging
    const activityToDelete = await ActivityModel.findById(params.id);
    if (!activityToDelete) {
      return NextResponse.json(
        { success: false, error: "Activity not found" },
        { status: 404 }
      );
    }

    const deletedActivity = await ActivityModel.findByIdAndDelete(params.id);
    
    // Log activity deletion
    const clientInfo = getClientInfo(request);
    
    if (permissionCheck.user?._id) {
      await logActivity({
        userId: permissionCheck.user._id.toString(),
        activityType: ActivityTypes.ACTIVITY_DELETED,
        description: `Deleted activity: ${activityToDelete.activityType}`,
        metadata: { 
          activityId: activityToDelete._id, 
          activityType: activityToDelete.activityType,
          targetUserId: activityToDelete.userId 
        },
        ...clientInfo
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Activity deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting activity:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete activity" },
      { status: 500 }
    );
  }
} 