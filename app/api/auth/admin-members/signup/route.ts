import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { AdminUser } from "@/models/AdminUser";
import bcrypt from "bcrypt";
import "@/models/Permission";
import { Permission } from "@/models/Permission";
import { checkAnyPermission, createAnyPermissionErrorResponse } from "@/lib/checkPermissions";
import { ActivityTypes, getClientInfo, logActivity } from "@/lib/activityLogger";

export async function POST(request: Request) {
  try {
    await dbConnect();

    // Permission check - ADMIN_USER_APPROVAL or SUPER_ADMIN
    const permissionCheck = await checkAnyPermission(["ADMIN_USER_APPROVAL", "SUPER_ADMIN"]);
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        createAnyPermissionErrorResponse(["ADMIN_USER_APPROVAL", "SUPER_ADMIN"], permissionCheck.permissions),
        { status: 403 }
      );
    }

    const body = await request.json();
    let permissions: String[] = [];
    const { email, password, role } = body;

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

    if (role === "super-admin") {
      const data = await Permission.find({}).select(
        "-name -description -createdAt -updatedAt -__v"
      );
      permissions = data.map((perm) => perm._id);
    }

    const newAdminUser = await AdminUser.create({ ...body, permissions });
    const userResponse = newAdminUser.toObject();
    delete userResponse.password;

    // Log activity
    await logActivity({
      userId: permissionCheck.user._id.toString(),
      activityType: ActivityTypes.ADMIN_USER_CREATED,
      description: `Created admin user: ${newAdminUser.fullName}`,
      metadata: { 
        adminUserId: newAdminUser._id, 
        adminUserEmail: newAdminUser.email,
        adminUserRole: newAdminUser.role 
      },
      ...getClientInfo(request)
    });

    return NextResponse.json(
      { success: true, data: userResponse },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating admin user:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
} 