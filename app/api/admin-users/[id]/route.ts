import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { AdminUser } from "@/models/AdminUser";
import "@/models/Permission";

type Context = {
  params: {
    id: string;
  };
};  

export async function GET(request: Request, { params }: Context) {
  try {
    await dbConnect();
    const adminUser = await AdminUser.findById(params.id, {
      password: 0,
    }).populate("permissions");
    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: "Admin user not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: adminUser });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch admin user" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    await dbConnect();
    const body = await request.json();

    // prevent password from being updated through this endpoint
    delete body.password;

    const updatedUser = await AdminUser.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: "Admin user not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    await dbConnect();
    const deletedUser = await AdminUser.findByIdAndDelete(params.id);
    if (!deletedUser) {
      return NextResponse.json(
        { success: false, error: "Admin user not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete admin user" },
      { status: 500 }
    );
  }
} 