import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { Permission } from "@/models/Permission";
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
      const permissions = await Permission.find({}).sort({ name: 1 });

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.ACTIVITY_VIEWED,
        description: "Viewed permissions list (Super Admin)",
        metadata: { count: permissions.length },
        ...getClientInfo(request)
      });

      return NextResponse.json({ success: true, data: permissions });
    }

    // Admin and Manager roles need specific permissions
    if (currentUser.role === "admin" || currentUser.role === "manager") {
      const permissionCheck = await checkAnyPermission(["ADMIN_USER_VIEW", "SUPER_ADMIN"]);
      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          createAnyPermissionErrorResponse(["ADMIN_USER_VIEW", "SUPER_ADMIN"], permissionCheck.permissions),
          { status: 403 }
        );
      }

      const permissions = await Permission.find({}).sort({ name: 1 });

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.ACTIVITY_VIEWED,
        description: `Viewed permissions list (${currentUser.role})`,
        metadata: { count: permissions.length },
        ...getClientInfo(request)
      });

      return NextResponse.json({ success: true, data: permissions });
    }

    // For all other roles, deny access
    return NextResponse.json(
      { success: false, error: "Access denied" },
      { status: 403 }
    );
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch permissions" },
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
      const { name, description } = body;

      // Check if permission already exists
      const existingPermission = await Permission.findOne({ name });
      if (existingPermission) {
        return NextResponse.json(
          { success: false, error: "Permission with this name already exists" },
          { status: 409 }
        );
      }

      const newPermission = await Permission.create({ name, description });

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.PERMISSION_CREATED,
        description: `Created permission: ${newPermission.name} (Super Admin)`,
        metadata: { 
          permissionId: newPermission._id,
          permissionName: newPermission.name
        },
        ...getClientInfo(request)
      });

      return NextResponse.json(
        { success: true, data: newPermission },
        { status: 201 }
      );
    }

    // Admin and Manager roles need specific permissions
    if (currentUser.role === "admin" || currentUser.role === "manager") {
      const permissionCheck = await checkAnyPermission(["USER_UPDATE", "SUPER_ADMIN"]);
      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          createAnyPermissionErrorResponse(["USER_UPDATE", "SUPER_ADMIN"], permissionCheck.permissions),
          { status: 403 }
        );
      }

      const body = await request.json();
      const { name, description } = body;

      // Check if permission already exists
      const existingPermission = await Permission.findOne({ name });
      if (existingPermission) {
        return NextResponse.json(
          { success: false, error: "Permission with this name already exists" },
          { status: 409 }
        );
      }

      const newPermission = await Permission.create({ name, description });

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.PERMISSION_CREATED,
        description: `Created permission: ${newPermission.name} (${currentUser.role})`,
        metadata: { 
          permissionId: newPermission._id,
          permissionName: newPermission.name
        },
        ...getClientInfo(request)
      });

      return NextResponse.json(
        { success: true, data: newPermission },
        { status: 201 }
      );
    }

    // For all other roles, deny access
    return NextResponse.json(
      { success: false, error: "Access denied" },
      { status: 403 }
    );
  } catch (error: any) {
    console.error("Error creating permission:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
} 