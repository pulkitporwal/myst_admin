import { NextRequest, NextResponse } from "next/server";
import { AdminUser } from "@/models/AdminUser";
import { dbConnect } from "@/lib/dbConnect";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { fullName, email, password } = await req.json();

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    const existingUser = await AdminUser.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await AdminUser.create({
      fullName,
      email,
      password: hashedPassword,
    });

    return NextResponse.json(
      { message: "User registered successfully.", user: newUser },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
