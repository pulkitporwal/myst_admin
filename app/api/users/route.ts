import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import "@/models/Interests"; // ✅ force model registration
import { UserModel } from "@/models/User"; // this uses ref: "Interest"

export async function GET() {
  try {
    await dbConnect();

    const users = await UserModel.find(
      { isActive: true },
      {
        password: 0,
        fcmToken: 0,
      }
    )
      .sort({ createdAt: -1 })
      .populate("interestIn", "interest description");

    return NextResponse.json(
      {
        success: true,
        data: users,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch users",
      },
      { status: 500 }
    );
  }
}
