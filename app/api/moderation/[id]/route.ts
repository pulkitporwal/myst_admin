import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { ContentReportModel } from "@/models/ReportContent";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const report = await ContentReportModel.findById(params.id)
      .populate("user_id", "fullName userName avatarURL")
      .populate("content_id");
    if (!report) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: report }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch report" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const body = await request.json();
    const updated = await ContentReportModel.findByIdAndUpdate(params.id, body, { new: true })
      .populate("user_id", "fullName userName avatarURL")
      .populate("content_id");
    if (!updated) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update report" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const deleted = await ContentReportModel.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Report deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete report" }, { status: 500 });
  }
} 