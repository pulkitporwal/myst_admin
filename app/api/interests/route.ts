import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { InterestModel } from "@/models/Interests";

export async function GET() {
  try {
    await dbConnect();

    const interests = await InterestModel.find({})
      .sort({ interest: 1 })
      .select("_id interest description");

    return NextResponse.json({ 
      success: true, 
      data: interests 
    });
  } catch (error) {
    console.error("Error fetching interests:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch interests" },
      { status: 500 }
    );
  }
} 