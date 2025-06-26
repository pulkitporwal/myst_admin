import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { AdminUser } from "@/models/AdminUser";
import bcrypt from "bcrypt";
import "@/models/Permission";
import { Permission } from "@/models/Permission";

export async function GET() {
  try {
    await dbConnect();
    const adminUsers = await AdminUser.find({}, { password: 0 }).populate(
      "permissions"
    );
    return NextResponse.json({ success: true, data: adminUsers });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch admin users" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    let permissions: String[] = [];
    const { email, password } = body;

    const existingUser = await AdminUser.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Admin user with this email already exists" },
        { status: 409 }
      );
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      body.password = hashedPassword;
    }
    if (body?.role === "super-admin") {
      const data = await Permission.find({}).select(
        "-name -description -createdAt -updatedAt -__v"
      );
      permissions = data.map((perm) => perm._id);
    }

    const newAdminUser = await AdminUser.create({ ...body, permissions });
    const userResponse = newAdminUser.toObject();
    delete userResponse.password;

    return NextResponse.json(
      { success: true, data: userResponse },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
