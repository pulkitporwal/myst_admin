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

// Get single task
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const currentUser = await getCurrentUserWithPermissions();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const task = await TaskModel.findById(params.id)
      .populate("assignedTo", "fullName email role")
      .populate("assignedBy", "fullName email role")
      .populate("approvedBy", "fullName email role");

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    // Check if user can view this task
    if (currentUser.role !== "super-admin") {
      const isAssignedTo = task.assignedTo?._id?.toString() === currentUser._id.toString();
      const isAssignedBy = task.assignedBy?._id?.toString() === currentUser._id.toString();

      if (!isAssignedTo && !isAssignedBy) {
        return NextResponse.json(
          { success: false, error: "Access denied" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}


// Update task (request completion, approve, reject)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const currentUser = await getCurrentUserWithPermissions();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, completionRequestNotes, approvalNotes } = body;

    const task = await TaskModel.findById(params.id);
    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    const STATUS = {
      PENDING: "pending",
      IN_PROGRESS: "in_progress",
      COMPLETION_REQUESTED: "completion_requested",
      APPROVED: "approved",
      REJECTED: "rejected",
    };

    const idEquals = (field:any, userId:any) => {
      if (!field) return false;
      return field?._id?.toString() === userId || field?.toString() === userId;
    };

    // Validate allowed actions
    const validActions = [
      "start_task",
      "request_completion",
      "approve_completion",
      "reject_completion",
    ];

    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action" },
        { status: 400 }
      );
    }

    // Helper to log and return
    const logAndRespond = async (activityType:any, description:any, successMessage:any) => {
      await task.save();
      await logActivity({
        userId: currentUser._id.toString(),
        activityType,
        description,
        metadata: {
          taskId: task._id,
          taskTitle: task.title,
        },
        ...getClientInfo(request),
      });
      return NextResponse.json({
        success: true,
        message: successMessage,
        data: task,
      });
    };

    // Super Admin and Admin logic
    if (currentUser.role === "super-admin" || currentUser.role === "admin") {
      if (action === "start_task") {
        if (task.status !== STATUS.PENDING) {
          return NextResponse.json(
            { success: false, error: "Task must be pending to start" },
            { status: 400 }
          );
        }
        task.status = STATUS.IN_PROGRESS;
        return logAndRespond(
          ActivityTypes.TASK_STARTED,
          `Started task: ${task.title} (${currentUser.role})`,
          "Task started successfully"
        );
      }

      if (action === "request_completion") {
        if (task.status !== STATUS.IN_PROGRESS) {
          return NextResponse.json(
            { success: false, error: "Task must be in progress to request completion" },
            { status: 400 }
          );
        }
        task.status = STATUS.COMPLETION_REQUESTED;
        task.completionRequestedAt = new Date();
        task.completionRequestNotes = completionRequestNotes;
        return logAndRespond(
          ActivityTypes.TASK_COMPLETED,
          `Requested task completion: ${task.title} (${currentUser.role})`,
          "Task completion requested"
        );
      }

      if (action === "approve_completion") {
        if (task.status !== STATUS.COMPLETION_REQUESTED) {
          return NextResponse.json(
            { success: false, error: "Task must have completion requested before approval" },
            { status: 400 }
          );
        }
        task.status = STATUS.APPROVED;
        task.approvedAt = new Date();
        task.approvedBy = currentUser._id;
        task.approvalNotes = approvalNotes;
        return logAndRespond(
          ActivityTypes.TASK_APPROVED,
          `Approved task completion: ${task.title} (${currentUser.role})`,
          "Task completion approved"
        );
      }

      if (action === "reject_completion") {
        if (task.status !== STATUS.COMPLETION_REQUESTED) {
          return NextResponse.json(
            { success: false, error: "Task must have completion requested before rejection" },
            { status: 400 }
          );
        }
        task.status = STATUS.REJECTED;
        task.approvalNotes = approvalNotes;
        return logAndRespond(
          ActivityTypes.TASK_REJECTED,
          `Rejected task completion: ${task.title} (${currentUser.role})`,
          "Task completion rejected"
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Invalid action or insufficient permissions" },
      { status: 403 }
    );
  } catch (error: any) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


// Delete task
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const currentUser = await getCurrentUserWithPermissions();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const task = await TaskModel.findById(params.id);
    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    // Super-admin can delete any task
    if (currentUser.role === "super-admin") {
      await TaskModel.findByIdAndDelete(params.id);

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.TASK_DELETED,
        description: `Deleted task: ${task.title} (Super Admin)`,
        metadata: {
          taskId: task._id,
          taskTitle: task.title,
        },
        ...getClientInfo(request),
      });

      return NextResponse.json({
        success: true,
        message: "Task deleted successfully",
      });
    }

    // Admin and Manager can only delete tasks they created
    if (currentUser.role === "admin" || currentUser.role === "manager") {
      if (task.assignedBy.toString() !== currentUser._id.toString()) {
        return NextResponse.json(
          { success: false, error: "You can only delete tasks you created" },
          { status: 403 }
        );
      }

      await TaskModel.findByIdAndDelete(params.id);

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.TASK_DELETED,
        description: `Deleted task: ${task.title} (${currentUser.role})`,
        metadata: {
          taskId: task._id,
          taskTitle: task.title,
        },
        ...getClientInfo(request),
      });

      return NextResponse.json({
        success: true,
        message: "Task deleted successfully",
      });
    }

    return NextResponse.json(
      { success: false, error: "Access denied" },
      { status: 403 }
    );
  } catch (error: any) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 