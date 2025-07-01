import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { TaskModel } from "@/models/Task";
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

    // Only allow super-admin, admin, manager
    if (!["super-admin", "admin", "manager"].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // For admin and manager, enforce TASK_VIEW permission
    if (currentUser.role !== "super-admin") {
      const permissionCheck = await checkAnyPermission(["TASK_VIEW"]);
      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          createAnyPermissionErrorResponse(["TASK_VIEW"], permissionCheck.permissions),
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const assignedTo = searchParams.get("assignedTo");

    let query: any = {};

    // Super-admin sees everything
    if (currentUser.role === "super-admin") {
      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (category) query.category = category;
      if (assignedTo) query.assignedTo = assignedTo;
    }

    // Admin sees everything (with filters)
    if (currentUser.role === "admin") {
      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (category) query.category = category;
      if (assignedTo) query.assignedTo = assignedTo;
    }

    // Manager can only see their own assigned or created tasks
    if (currentUser.role === "manager") {
      query.$or = [
        { assignedTo: currentUser._id },
        { assignedBy: currentUser._id }
      ];

      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (category) query.category = category;
      if (assignedTo) query.assignedTo = assignedTo;
    }

    const tasks = await TaskModel.find(query)
      .populate("assignedTo", "fullName email role")
      .populate("assignedBy", "fullName email role")
      .populate("approvedBy", "fullName email role")
      .sort({ createdAt: -1 });

    await logActivity({
      userId: currentUser._id.toString(),
      activityType: ActivityTypes.ACTIVITY_VIEWED,
      description: `Viewed tasks list (${currentUser.role})`,
      metadata: {
        count: tasks.length,
        filters: { status, priority, category, assignedTo }
      },
      ...getClientInfo(request),
    });

    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tasks" },
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

    // Only super-admin, admin, manager can create tasks
    if (!["super-admin", "admin", "manager"].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      priority,
      assignedTo,
      dueDate,
      category,
      tags
    } = body;

    // Validate required fields
    if (!title || !description || !assignedTo || !dueDate) {
      return NextResponse.json(
        {
          success: false,
          error: "Title, description, assignedTo, and dueDate are required."
        },
        { status: 400 }
      );
    }

    // For admin/manager, enforce TASK_CREATE permission
    if (currentUser.role !== "super-admin") {
      const permissionCheck = await checkAnyPermission(["TASK_CREATE"]);
      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          createAnyPermissionErrorResponse(["TASK_CREATE"], permissionCheck.permissions),
          { status: 403 }
        );
      }
    }

    // Create the task
    const newTask = await TaskModel.create({
      title,
      description,
      priority: priority || "medium",
      assignedTo,
      assignedBy: currentUser._id,
      dueDate: new Date(dueDate),
      category: category || "other",
      tags: tags || [],
    });

    const populatedTask = await TaskModel.findById(newTask._id)
      .populate("assignedTo", "fullName email role")
      .populate("assignedBy", "fullName email role");

    await logActivity({
      userId: currentUser._id.toString(),
      activityType: ActivityTypes.ACTIVITY_CREATED,
      description: `Created task: ${newTask.title} (${currentUser.role})`,
      metadata: {
        taskId: newTask._id,
        taskTitle: newTask.title,
        assignedTo: newTask.assignedTo,
        priority: newTask.priority,
      },
      ...getClientInfo(request),
    });

    return NextResponse.json(
      { success: true, data: populatedTask },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create task" },
      { status: 500 }
    );
  }
}
