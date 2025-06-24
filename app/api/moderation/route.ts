import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { UserModel } from "@/models/User";
import { ContentModel } from "@/models/Content";
import { ContentReportModel } from "@/models/ReportContent";

export async function GET() {
  try {
    await dbConnect();
    const reports = await ContentReportModel.aggregate([
      {
        $lookup: {
          from: "users", // collection name in MongoDB
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" }, // if you want user as a single object, not array
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
          content_id: 1, // will be replaced by next $lookup
        },
      },
      {
        $lookup: {
          from: "contents", // collection name (MUST be lowercase and plural)
          localField: "content_id",
          foreignField: "_id",
          as: "content",
        },
      },
      { $unwind: "$content" }, // make content a single object instead of array
      {
        $project: {
          reason: 1,
          status: 1,
          createdAt: 1,
          user: 1,
          content: {
            _id: 1,
            content_url: 1,
            caption: 1,
            category: 1,
            thumbnail_url: 1,
          },
        },
      },
    ]);


    return NextResponse.json({ success: true, data: reports }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const report = await ContentReportModel.create(body);
    return NextResponse.json({ success: true, data: report }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create report" },
      { status: 500 }
    );
  }
}
