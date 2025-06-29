import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { AdminUser } from "@/models/AdminUser";
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

// Get pending applications
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
      const pendingApplications = await AdminUser.find(
        { isActive: false },
        { password: 0 }
      ).sort({ createdAt: -1 });

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.ACTIVITY_VIEWED,
        description: "Viewed pending admin applications (Super Admin)",
        metadata: { count: pendingApplications.length },
        ...getClientInfo(request),
      });

      return NextResponse.json({ 
        success: true, 
        data: pendingApplications 
      });
    }

    // Admin and Manager roles need specific permissions
    if (currentUser.role === "admin" || currentUser.role === "manager") {
      const permissionCheck = await checkAnyPermission(["ADMIN_USER_VIEW", "SUPER_ADMIN"]);
      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          createAnyPermissionErrorResponse(
            ["ADMIN_USER_VIEW", "SUPER_ADMIN"],
            permissionCheck.permissions
          ),
          { status: 403 }
        );
      }

      const pendingApplications = await AdminUser.find(
        { isActive: false },
        { password: 0 }
      ).sort({ createdAt: -1 });

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.ACTIVITY_VIEWED,
        description: `Viewed pending admin applications (${currentUser.role})`,
        metadata: { count: pendingApplications.length },
        ...getClientInfo(request),
      });

      return NextResponse.json({ 
        success: true, 
        data: pendingApplications 
      });
    }

    // For all other roles, deny access
    return NextResponse.json(
      { success: false, error: "Access denied" },
      { status: 403 }
    );
  } catch (error) {
    console.error("Error fetching pending applications:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch pending applications" },
      { status: 500 }
    );
  }
}

// Activate a pending application
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
      const { userId, action, notes } = await request.json();

      if (!userId || !action) {
        return NextResponse.json(
          { success: false, error: "User ID and action are required" },
          { status: 400 }
        );
      }

      if (!["approve", "reject"].includes(action)) {
        return NextResponse.json(
          { success: false, error: "Action must be either 'approve' or 'reject'" },
          { status: 400 }
        );
      }

      const user = await AdminUser.findById(userId);
      if (!user) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      if (user.isActive) {
        return NextResponse.json(
          { success: false, error: "User is already active" },
          { status: 400 }
        );
      }

      if (action === "approve") {
        // Activate the user
        user.isActive = true;
        user.notes = notes || user.notes;
        await user.save();

        await logActivity({
          userId: currentUser._id.toString(),
          activityType: ActivityTypes.ADMIN_USER_ACTIVATED,
          description: `Approved admin application for: ${user.fullName} (Super Admin)`,
          metadata: {
            adminUserId: user._id,
            adminUserEmail: user.email,
            adminUserRole: user.role,
            notes: notes,
          },
          ...getClientInfo(request),
        });

        return NextResponse.json({
          success: true,
          message: "Application approved successfully",
          data: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
          },
        });
      } else {
        // Reject the application by deleting the user
        await AdminUser.findByIdAndDelete(userId);

        await logActivity({
          userId: currentUser._id.toString(),
          activityType: ActivityTypes.ADMIN_USER_REJECTED,
          description: `Rejected admin application for: ${user.fullName} (Super Admin)`,
          metadata: {
            adminUserEmail: user.email,
            adminUserRole: user.role,
            notes: notes,
          },
          ...getClientInfo(request),
        });

        return NextResponse.json({
          success: true,
          message: "Application rejected successfully",
        });
      }
    }

    // Admin and Manager roles need specific permissions
    if (currentUser.role === "admin" || currentUser.role === "manager") {
      const permissionCheck = await checkAnyPermission(["ADMIN_USER_CREATE", "SUPER_ADMIN"]);
      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          createAnyPermissionErrorResponse(
            ["ADMIN_USER_CREATE", "SUPER_ADMIN"],
            permissionCheck.permissions
          ),
          { status: 403 }
        );
      }

      const { userId, action, notes } = await request.json();

      if (!userId || !action) {
        return NextResponse.json(
          { success: false, error: "User ID and action are required" },
          { status: 400 }
        );
      }

      if (!["approve", "reject"].includes(action)) {
        return NextResponse.json(
          { success: false, error: "Action must be either 'approve' or 'reject'" },
          { status: 400 }
        );
      }

      const user = await AdminUser.findById(userId);
      if (!user) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      if (user.isActive) {
        return NextResponse.json(
          { success: false, error: "User is already active" },
          { status: 400 }
        );
      }

      if (action === "approve") {
        // Activate the user
        user.isActive = true;
        user.notes = notes || user.notes;
        await user.save();

        await logActivity({
          userId: currentUser._id.toString(),
          activityType: ActivityTypes.ADMIN_USER_ACTIVATED,
          description: `Approved admin application for: ${user.fullName} (${currentUser.role})`,
          metadata: {
            adminUserId: user._id,
            adminUserEmail: user.email,
            adminUserRole: user.role,
            notes: notes,
          },
          ...getClientInfo(request),
        });

        return NextResponse.json({
          success: true,
          message: "Application approved successfully",
          data: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
          },
        });
      } else {
        // Reject the application by deleting the user
        await AdminUser.findByIdAndDelete(userId);

        await logActivity({
          userId: currentUser._id.toString(),
          activityType: ActivityTypes.ADMIN_USER_REJECTED,
          description: `Rejected admin application for: ${user.fullName} (${currentUser.role})`,
          metadata: {
            adminUserEmail: user.email,
            adminUserRole: user.role,
            notes: notes,
          },
          ...getClientInfo(request),
        });

        return NextResponse.json({
          success: true,
          message: "Application rejected successfully",
        });
      }
    }

    // For all other roles, deny access
    return NextResponse.json(
      { success: false, error: "Access denied" },
      { status: 403 }
    );
  } catch (error: any) {
    console.error("Error processing application:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 