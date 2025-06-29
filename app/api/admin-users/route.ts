import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { AdminUser } from "@/models/AdminUser";
import bcrypt from "bcrypt";
import "@/models/Permission";
import { Permission } from "@/models/Permission";
import { getCurrentUserWithPermissions } from "@/lib/getCurrentUserWithPermissions";
import {
  checkAnyPermission,
  createAnyPermissionErrorResponse,
} from "@/lib/checkPermissions";
import {
  ActivityTypes,
  getClientInfo,
  logActivity,
} from "@/lib/activityLogger";

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
      const adminUsers = await AdminUser.find({}, { password: 0 }).populate(
        "permissions"
      );

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.ACTIVITY_VIEWED,
        description: "Viewed admin users list (Super Admin)",
        metadata: { count: adminUsers.length },
        ...getClientInfo(request),
      });

      return NextResponse.json({ success: true, data: adminUsers });
    }

    // Admin and Manager roles need specific permissions
    if (currentUser.role === "admin" || currentUser.role === "manager") {
      const permissionCheck = await checkAnyPermission([
        "ADMIN_USER_VIEW",
        "USER_VIEW_ASSIGNED",
        "SUPER_ADMIN",
      ]);
      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          createAnyPermissionErrorResponse(
            ["ADMIN_USER_VIEW", "USER_VIEW_ASSIGNED", "SUPER_ADMIN"],
            permissionCheck.permissions
          ),
          { status: 403 }
        );
      }

      const adminUsers = await AdminUser.find({}, { password: 0 }).populate(
        "permissions"
      );

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.ACTIVITY_VIEWED,
        description: `Viewed admin users list (${currentUser.role})`,
        metadata: { count: adminUsers.length },
        ...getClientInfo(request),
      });

      return NextResponse.json({ success: true, data: adminUsers });
    }

    // For all other roles, deny access
    return NextResponse.json(
      { success: false, error: "Access denied" },
      { status: 403 }
    );
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch admin users" },
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

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.ADMIN_USER_CREATED,
        description: `Created admin user: ${newAdminUser.fullName} (Super Admin)`,
        metadata: {
          adminUserId: newAdminUser._id,
          adminUserEmail: newAdminUser.email,
          adminUserRole: newAdminUser.role,
        },
        ...getClientInfo(request),
      });

      return NextResponse.json(
        { success: true, data: userResponse },
        { status: 201 }
      );
    }

    // Admin and Manager roles need specific permissions
    if (currentUser.role === "admin" || currentUser.role === "manager") {
      const permissionCheck = await checkAnyPermission([
        "USER_CREATE",
        "SUPER_ADMIN",
      ]);
      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          createAnyPermissionErrorResponse(
            ["USER_CREATE", "SUPER_ADMIN"],
            permissionCheck.permissions
          ),
          { status: 403 }
        );
      }

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

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.ADMIN_USER_CREATED,
        description: `Created admin user: ${newAdminUser.fullName} (${currentUser.role})`,
        metadata: {
          adminUserId: newAdminUser._id,
          adminUserEmail: newAdminUser.email,
          adminUserRole: newAdminUser.role,
        },
        ...getClientInfo(request),
      });

      return NextResponse.json(
        { success: true, data: userResponse },
        { status: 201 }
      );
    }

    // For all other roles, deny access
    return NextResponse.json(
      { success: false, error: "Access denied" },
      { status: 403 }
    );
  } catch (error: any) {
    console.error("Error creating admin user:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
