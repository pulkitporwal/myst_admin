import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { getCurrentUserWithPermissions } from "@/lib/getCurrentUserWithPermissions";

export async function GET() {
  try {
    await dbConnect();
    const currentUser = await getCurrentUserWithPermissions();
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        user: currentUser.user,
        permissions: currentUser.permissions
      }
    });
  } catch (error) {
    console.error("Error fetching current user permissions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch current user permissions" },
      { status: 500 }
    );
  }
} 