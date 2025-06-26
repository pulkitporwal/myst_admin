import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { Permission } from "@/models/Permission";

type Context = {
  params: {
    id: string;
  };
};

export async function GET(request: Request, { params }: Context) {
  try {
    await dbConnect();
    const permission = await Permission.findById(params.id);
    if (!permission) {
      return NextResponse.json(
        { success: false, error: "Permission not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: permission });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch permission" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    await dbConnect();
    const body = await request.json();
    const updatedPermission = await Permission.findByIdAndUpdate(
      params.id,
      body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedPermission) {
      return NextResponse.json(
        { success: false, error: "Permission not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: updatedPermission });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Permission with this name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    await dbConnect();
    const deletedPermission = await Permission.findByIdAndDelete(params.id);
    if (!deletedPermission) {
      return NextResponse.json(
        { success: false, error: "Permission not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete permission" },
      { status: 500 }
    );
  }
} 