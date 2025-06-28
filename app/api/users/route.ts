import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import "@/models/Interests"; 
import { UserModel } from "@/models/User"; 
import { getCurrentUserWithPermissions } from "@/lib/getCurrentUserWithPermissions";
import { checkAnyPermission, createAnyPermissionErrorResponse } from "@/lib/checkPermissions";
import { ActivityTypes, getClientInfo, logActivity } from "@/lib/activityLogger";

export async function GET(request: Request) {
  try {
    await dbConnect();

    // Permission check - USER_PROFILE_VIEW or SUPER_ADMIN
    const permissionCheck = await checkAnyPermission(["USER_PROFILE_VIEW", "SUPER_ADMIN"]);
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        createAnyPermissionErrorResponse(["USER_PROFILE_VIEW", "SUPER_ADMIN"], permissionCheck.permissions),
        { status: 403 }
      );
    }

    const users = await UserModel.find(
      { isActive: true },
      {
        password: 0,
        fcmToken: 0,
      }
    )
      .sort({ createdAt: -1 })
      .populate("interestIn", "interest description")
      .populate("assignedTo", "fullName email role");

    // Log activity
    await logActivity({
      userId: permissionCheck.user._id.toString(),
      activityType: ActivityTypes.ACTIVITY_VIEWED,
      description: "Viewed users list",
      metadata: { 
        count: users.length,
        filters: { isActive: true }
      },
      ...getClientInfo(request)
    });

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

export async function POST(request: Request) {
  try {
    await dbConnect();

    // Permission check - USER_CREATE or SUPER_ADMIN
    const permissionCheck = await checkAnyPermission(["USER_CREATE", "SUPER_ADMIN"]);
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        createAnyPermissionErrorResponse(["USER_CREATE", "SUPER_ADMIN"], permissionCheck.permissions),
        { status: 403 }
      );
    }

    const body = await request.json();
    const newUser = await UserModel.create(body);

    // Log activity
    await logActivity({
      userId: permissionCheck.user._id.toString(),
      activityType: ActivityTypes.USER_CREATED,
      description: `Created user: ${newUser.fullName}`,
      metadata: { 
        userId: newUser._id,
        userEmail: newUser.email
      },
      ...getClientInfo(request)
    });

    return NextResponse.json(
      { success: true, data: newUser },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
