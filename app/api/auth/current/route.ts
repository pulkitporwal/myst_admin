import { NextResponse } from "next/server";
import { getCurrentUserWithPermissions } from "@/lib/getCurrentUserWithPermissions";

export async function GET() {
  try {
    const currentUser = await getCurrentUserWithPermissions();
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const userData = {
      _id: currentUser._id,
      fullName: currentUser.fullName,
      email: currentUser.email,
      role: currentUser.role,
      isActive: currentUser.isActive,
      permissions: currentUser.permissions,
    };

    return NextResponse.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch current user" },
      { status: 500 }
    );
  }
} 