import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import "@/models/Interests";
import { UserModel } from "@/models/User";
import { getCurrentUserWithPermissions } from "@/lib/getCurrentUserWithPermissions";
import { checkAnyPermission, createAnyPermissionErrorResponse } from "@/lib/checkPermissions";
import { ActivityTypes, getClientInfo, logActivity } from "@/lib/activityLogger";
import * as bcrypt from "bcryptjs";

export async function GET(request: Request) {
  try {
    await dbConnect();

    // 1️⃣ Get current user
    const currentUser = await getCurrentUserWithPermissions();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2️⃣ Super Admin: all users
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
        description: "Viewed all users list (Super Admin)",
        metadata: {
          count: users.length,
          filters: { isActive: true }
        },
        ...getClientInfo(request)
      });

      return NextResponse.json(
        { success: true, data: users },
        { status: 200 }
      );
    }

    // 3️⃣ Admin: must have USER_VIEW to view all users
    if (currentUser.role === "admin") {
      const permissionCheck = await checkAnyPermission(["USER_VIEW"]);
      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          createAnyPermissionErrorResponse(["USER_VIEW"], permissionCheck.permissions),
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
        description: "Viewed all users list (Admin)",
        metadata: {
          count: users.length,
          filters: { isActive: true }
        },
        ...getClientInfo(request)
      });

      return NextResponse.json(
        { success: true, data: users },
        { status: 200 }
      );
    }

    // 4️⃣ Manager: must have USER_VIEW, and only see assigned users
    if (currentUser.role === "manager") {
      const permissionCheck = await checkAnyPermission(["USER_VIEW"]);
      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          createAnyPermissionErrorResponse(["USER_VIEW"], permissionCheck.permissions),
          { status: 403 }
        );
      }

      const users = await UserModel.find(
        {
          isActive: true,
          assignedTo: currentUser._id,
        },
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
        description: "Viewed assigned users list (Manager)",
        metadata: {
          count: users.length,
          filters: { isActive: true, assignedTo: currentUser._id }
        },
        ...getClientInfo(request)
      });

      return NextResponse.json(
        { success: true, data: users },
        { status: 200 }
      );
    }

    // 5️⃣ All other roles: deny
    return NextResponse.json(
      { success: false, error: "Access denied" },
      { status: 403 }
    );
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    // 1️⃣ Authenticate user
    const currentUser = await getCurrentUserWithPermissions();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2️⃣ Only super-admin, admin, or manager can proceed
    if (!["super-admin", "admin", "manager"].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // 3️⃣ If super-admin, no permission check needed
    if (currentUser.role !== "super-admin") {
      const permissionCheck = await checkAnyPermission(["USER_CREATE"]);
      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          createAnyPermissionErrorResponse(["USER_CREATE"], permissionCheck.permissions),
          { status: 403 }
        );
      }
    }

    // 4️⃣ Extract and validate request body
    const body = await request.json();
    const {
      fullName,
      userName,
      gender,
      dob,
      avatarURL,
      mobileNumber,
      email,
      bio,
      password,
      interestIn,
      assignedTo,
      socialLinks,
      referralCode,
    } = body;

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // 5️⃣ Manager can ONLY assign users to themselves
    if (currentUser.role === "manager") {
      if (assignedTo && assignedTo.toString() !== currentUser._id.toString()) {
        return NextResponse.json(
          {
            success: false,
            error: "Managers can only assign users to themselves.",
          },
          { status: 403 }
        );
      }
    }

    // 6️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password,  10);

    // 7️⃣ Create user
    const newUser = new UserModel({
      fullName,
      userName,
      gender,
      dob,
      avatarURL,
      mobileNumber,
      email,
      bio,
      interestIn,
      assignedTo: currentUser.role === "manager" ? currentUser._id : assignedTo,
      socialLinks,
      referralCode,
      password: hashedPassword,
      isActive: true,
      isVerified: false,
      wallet: 100,
    });

    await newUser.save();

    // 8️⃣ Log activity
    await logActivity({
      userId: currentUser._id.toString(),
      activityType: ActivityTypes.ACTIVITY_CREATED,
      description: `Created a new user (${newUser.fullName})`,
      metadata: {
        createdUserId: newUser._id,
        createdUserEmail: email,
        assignedTo: newUser.assignedTo,
      },
      ...getClientInfo(request),
    });

    return NextResponse.json(
      { success: true, data: { _id: newUser._id, userName, email } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create user" },
      { status: 500 }
    );
  }
}
