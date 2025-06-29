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

    const currentUser = await getCurrentUserWithPermissions();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Super-admin bypasses permission checks
    if (currentUser.role === "super-admin") {
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

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.ACTIVITY_VIEWED,
        description: "Viewed users list (Super Admin)",
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
    }

    // Admin and Manager roles need specific permissions
    if (currentUser.role === "admin" || currentUser.role === "manager") {
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

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.ACTIVITY_VIEWED,
        description: `Viewed users list (${currentUser.role})`,
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
    }

    // For all other roles, deny access
    return NextResponse.json(
      { success: false, error: "Access denied" },
      { status: 403 }
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

    const currentUser = await getCurrentUserWithPermissions();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Super-admin bypasses permission checks
    if (currentUser.role === "super-admin") {
      const body = await request.json();
      const newUser = await UserModel.create(body);

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.USER_CREATED,
        description: `Created user: ${newUser.fullName} (Super Admin)`,
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
    }

    // Admin and Manager roles need specific permissions
    if (currentUser.role === "admin" || currentUser.role === "manager") {
      const permissionCheck = await checkAnyPermission(["USER_CREATE", "SUPER_ADMIN"]);
      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          createAnyPermissionErrorResponse(["USER_CREATE", "SUPER_ADMIN"], permissionCheck.permissions),
          { status: 403 }
        );
      }

      const body = await request.json();
      const newUser = await UserModel.create(body);

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.USER_CREATED,
        description: `Created user: ${newUser.fullName} (${currentUser.role})`,
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
    }

    // For all other roles, deny access
    return NextResponse.json(
      { success: false, error: "Access denied" },
      { status: 403 }
    );
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
