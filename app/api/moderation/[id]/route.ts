import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { checkAnyPermission, createAnyPermissionErrorResponse } from "@/lib/checkPermissions";
import { ActivityTypes, getClientInfo, logActivity } from "@/lib/activityLogger";
import { ContentReportModel } from "@/models/ReportContent";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    // Permission check - CONTENT_VIEW or SUPER_ADMIN
    const permissionCheck = await checkAnyPermission(["CONTENT_VIEW", "SUPER_ADMIN"]);
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        createAnyPermissionErrorResponse(["CONTENT_VIEW", "SUPER_ADMIN"], permissionCheck.permissions),
        { status: 403 }
      );
    }

    const { id } = await params;
    const report = await ContentReportModel.findById(id);

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 }
      );
    }

    // Log activity
    await logActivity({
      userId: permissionCheck.user._id.toString(),
      activityType: ActivityTypes.ACTIVITY_VIEWED,
      description: `Viewed moderation report: ${report._id}`,
      metadata: { reportId: report._id },
      ...getClientInfo(request)
    });

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error("Error fetching moderation report:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch moderation report" },
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

    // Permission check - USER_BAN or SUPER_ADMIN
    const permissionCheck = await checkAnyPermission(["USER_BAN", "SUPER_ADMIN"]);
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        createAnyPermissionErrorResponse(["USER_BAN", "SUPER_ADMIN"], permissionCheck.permissions),
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const report = await ContentReportModel.findById(id);

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 }
      );
    }

    // Update the report
    const updatedReport = await ContentReportModel.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    // Log activity
    await logActivity({
      userId: permissionCheck.user._id.toString(),
      activityType: ActivityTypes.MODERATION_ACTION,
      description: `Updated moderation report: ${updatedReport._id}`,
      metadata: { 
        reportId: updatedReport._id,
        updatedFields: Object.keys(body)
      },
      ...getClientInfo(request)
    });

    return NextResponse.json({ success: true, data: updatedReport });
  } catch (error: any) {
    console.error("Error updating moderation report:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const deleted = await ContentReportModel.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: true, message: "Report deleted" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete report" },
      { status: 500 }
    );
  }
}
