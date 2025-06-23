import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { UserModel } from "@/models/User";

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = context.params;

    const user = await UserModel.findOne(
      {
        _id: id,
        isActive: true,
      },
      {
        password: 0,
        fcmToken: 0,
      }
    ).populate("interestIn"); // Optional if you want interests

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch user",
      },
      { status: 500 }
    );
  }
}

