import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { UserModel } from "@/models/User";
import { ContentModel } from "@/models/Content";
import { ContentReportModel } from "@/models/ReportContent";

export async function GET() {
  try {
    await dbConnect();
    const reports = await ContentReportModel.find()
      .populate("user_id", "fullName userName avatarURL")
      .populate("content_id");

      console.log(reports)

    return NextResponse.json({ success: true, data: reports }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch reports" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const report = await ContentReportModel.create(body);
    return NextResponse.json({ success: true, data: report }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create report" }, { status: 500 });
  }
} 