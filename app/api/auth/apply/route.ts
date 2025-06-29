import { NextRequest, NextResponse } from "next/server";
import { AdminUser } from "@/models/AdminUser";
import { dbConnect } from "@/lib/dbConnect";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { fullName, email, password, phoneNumber, role, notes } = await req.json();

    // Validate required fields
    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: "Full name, email, and password are required." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await AdminUser.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Validate role
    const validRoles = ["manager", "admin"];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role specified." },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin user with isActive set to false initially
    const newUser = await AdminUser.create({
      fullName,
      email,
      password: hashedPassword,
      phoneNumber: phoneNumber || "",
      role: role || "manager",
      notes: notes || "",
      isActive: false, // New applications start as inactive
    });

    return NextResponse.json(
      { 
        message: "Application submitted successfully. A super admin will review and activate your account.", 
        user: {
          id: newUser._id,
          fullName: newUser.fullName,
          email: newUser.email,
          role: newUser.role,
          isActive: newUser.isActive,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Application submission error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
} 