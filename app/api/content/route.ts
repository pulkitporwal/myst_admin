import { NextResponse } from "next/server";
import { ContentModel } from "@/models/Content";
import { UserModel } from "@/models/User";
import "@/models/Interests";
import { dbConnect } from "@/lib/dbConnect";

export async function GET() {
  try {
    await dbConnect();

    UserModel.modelName;

    const contents = await ContentModel.find()
      .populate("user_id", "fullName userName avatarURL")
      .populate("category", "interest");
    return NextResponse.json(
      { success: true, data: contents },
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

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const content = await ContentModel.create(body);
    return NextResponse.json({ success: true, data: content }, { status: 201 });
  } catch (error) {
    console.error("Error creating content:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create content" },
      { status: 500 }
    );
  }
}
