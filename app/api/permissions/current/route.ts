import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { getCurrentUserWithPermissions } from "@/lib/getCurrentUserWithPermissions";
import { checkAnyPermission, createAnyPermissionErrorResponse } from "@/lib/checkPermissions";
import { ActivityTypes, getClientInfo, logActivity } from "@/lib/activityLogger";

export async function GET(request: Request) {
  try {
    await dbConnect();

    // Permission check - ADMIN_USER_VIEW or SUPER_ADMIN
    const permissionCheck = await checkAnyPermission(["ADMIN_USER_VIEW", "SUPER_ADMIN"]);
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        createAnyPermissionErrorResponse(["ADMIN_USER_VIEW", "SUPER_ADMIN"], permissionCheck.permissions),
        { status: 403 }
      );
    }

    const currentUser = await getCurrentUserWithPermissions();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Log activity
    await logActivity({
      userId: permissionCheck.user._id.toString(),
      activityType: ActivityTypes.ACTIVITY_VIEWED,
      description: "Viewed current user permissions",
      metadata: { 
        userId: currentUser._id,
        permissionCount: currentUser.permissions?.length || 0
      },
      ...getClientInfo(request)
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        user: currentUser,
        permissions: currentUser.permissions || []
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