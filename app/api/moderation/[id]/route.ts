import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { ContentReportModel } from "@/models/ReportContent";
import { Types } from "mongoose";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const report = await ContentReportModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(params.id),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "contents",
          localField: "content_id",
          foreignField: "_id",
          as: "content",
        },
      },
      { $unwind: "$content" },
      {
        $project: {
          reason: 1,
          status: 1,
          createdAt: 1,
          user: {
            _id: 1,
            fullName: 1,
            userName: 1,
            avatarURL: 1,
          },
          content: {
            _id: 1,
            content_url: 1,
            caption: 1,
            content_type: 1,
            media_type: 1,
          },
        },
      },
    ]);
    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: report }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const body = await request.json();
    const updated = await ContentReportModel.findByIdAndUpdate(
      params.id,
      body,
      { new: true }
    )
      .populate("user_id", "fullName userName avatarURL")
      .populate("content_id");
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update report" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const deleted = await ContentReportModel.findByIdAndDelete(params.id);
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
