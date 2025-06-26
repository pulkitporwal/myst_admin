import { NextResponse } from "next/server";
import "@/models/Interests";
import { dbConnect } from "@/lib/dbConnect";
import { ContentModel } from "@/models/Content";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const content = await ContentModel.findById(params.id)
      .populate("user_id", "fullName userName avatarURL")
      .populate("category", "interest description");
    if (!content) {
      return NextResponse.json({ success: false, error: "Content not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: content }, { status: 200 });
  } catch (error) {
    console.error("Error fetching content:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch content" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const body = await request.json();
    const updated = await ContentModel.findByIdAndUpdate(params.id, body, { new: true })
      .populate("user_id", "fullName userName avatarURL")
      .populate("category", "interest description");
    if (!updated) {
      return NextResponse.json({ success: false, error: "Content not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    console.error("Error updating content:", error);
    return NextResponse.json({ success: false, error: "Failed to update content" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const deleted = await ContentModel.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Content not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Content deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting content:", error);
    return NextResponse.json({ success: false, error: "Failed to delete content" }, { status: 500 });
  }
} 