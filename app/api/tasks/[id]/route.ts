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
      if (task.assignedTo._id.toString() !== currentUser._id.toString() && 
          task.assignedBy._id.toString() !== currentUser._id.toString()) {
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

    // Super-admin can perform any action
    if (currentUser.role === "super-admin") {
      if (action === "start_task") {
        // Only the assigned user can start the task
        if (task.assignedTo.toString() !== currentUser._id.toString()) {
          return NextResponse.json(
            { success: false, error: "Only the assigned user can start this task" },
            { status: 403 }
          );
        }

        if (task.status !== "pending") {
          return NextResponse.json(
            { success: false, error: "Task must be pending to start" },
            { status: 400 }
          );
        }

        task.status = "in_progress";
        
        await task.save();

        await logActivity({
          userId: currentUser._id.toString(),
          activityType: ActivityTypes.TASK_STARTED,
          description: `Started task: ${task.title} (Super Admin)`,
          metadata: {
            taskId: task._id,
            taskTitle: task.title,
          },
          ...getClientInfo(request),
        });

        return NextResponse.json({
          success: true,
          message: "Task started successfully",
          data: task,
        });
      }

      if (action === "request_completion") {
        // Only the assigned user can request completion
        if (task.assignedTo.toString() !== currentUser._id.toString()) {
          return NextResponse.json(
            { success: false, error: "Only the assigned user can request completion" },
            { status: 403 }
          );
        }

        if (task.status !== "in_progress") {
          return NextResponse.json(
            { success: false, error: "Task must be in progress to request completion" },
            { status: 400 }
          );
        }

        task.status = "completion_requested";
        task.completionRequestedAt = new Date();
        task.completionRequestNotes = completionRequestNotes;
        
        await task.save();

        await logActivity({
          userId: currentUser._id.toString(),
          activityType: ActivityTypes.TASK_COMPLETED,
          description: `Requested task completion: ${task.title} (Super Admin)`,
          metadata: {
            taskId: task._id,
            taskTitle: task.title,
          },
          ...getClientInfo(request),
        });

        return NextResponse.json({
          success: true,
          message: "Task completion requested",
          data: task,
        });
      }

      if (action === "approve_completion") {
        // Only the person who created the task can approve
        if (task.assignedBy.toString() !== currentUser._id.toString()) {
          return NextResponse.json(
            { success: false, error: "Only the task creator can approve completion" },
            { status: 403 }
          );
        }

        if (task.status !== "completion_requested") {
          return NextResponse.json(
            { success: false, error: "Task must have completion requested before approval" },
            { status: 400 }
          );
        }

        task.status = "approved";
        task.approvedAt = new Date();
        task.approvedBy = currentUser._id;
        task.approvalNotes = approvalNotes;
        
        await task.save();

        await logActivity({
          userId: currentUser._id.toString(),
          activityType: ActivityTypes.TASK_APPROVED,
          description: `Approved task completion: ${task.title} (Super Admin)`,
          metadata: {
            taskId: task._id,
            taskTitle: task.title,
          },
          ...getClientInfo(request),
        });

        return NextResponse.json({
          success: true,
          message: "Task completion approved",
          data: task,
        });
      }

      if (action === "reject_completion") {
        // Only the person who created the task can reject
        if (task.assignedBy.toString() !== currentUser._id.toString()) {
          return NextResponse.json(
            { success: false, error: "Only the task creator can reject completion" },
            { status: 403 }
          );
        }

        if (task.status !== "completion_requested") {
          return NextResponse.json(
            { success: false, error: "Task must have completion requested before rejection" },
            { status: 400 }
          );
        }

        task.status = "rejected";
        task.approvalNotes = approvalNotes;
        
        await task.save();

        await logActivity({
          userId: currentUser._id.toString(),
          activityType: ActivityTypes.TASK_REJECTED,
          description: `Rejected task completion: ${task.title} (Super Admin)`,
          metadata: {
            taskId: task._id,
            taskTitle: task.title,
          },
          ...getClientInfo(request),
        });

        return NextResponse.json({
          success: true,
          message: "Task completion rejected",
          data: task,
        });
      }
    }

    // Admin and Manager roles
    if (currentUser.role === "admin" || currentUser.role === "manager") {
      if (action === "start_task") {
        // Only the assigned user can start the task
        if (task.assignedTo.toString() !== currentUser._id.toString()) {
          return NextResponse.json(
            { success: false, error: "Only the assigned user can start this task" },
            { status: 403 }
          );
        }

        if (task.status !== "pending") {
          return NextResponse.json(
            { success: false, error: "Task must be pending to start" },
            { status: 400 }
          );
        }

        task.status = "in_progress";
        
        await task.save();

        await logActivity({
          userId: currentUser._id.toString(),
          activityType: ActivityTypes.TASK_STARTED,
          description: `Started task: ${task.title} (${currentUser.role})`,
          metadata: {
            taskId: task._id,
            taskTitle: task.title,
          },
          ...getClientInfo(request),
        });

        return NextResponse.json({
          success: true,
          message: "Task started successfully",
          data: task,
        });
      }

      if (action === "request_completion") {
        // Only the assigned user can request completion
        if (task.assignedTo.toString() !== currentUser._id.toString()) {
          return NextResponse.json(
            { success: false, error: "Only the assigned user can request completion" },
            { status: 403 }
          );
        }

        if (task.status !== "in_progress") {
          return NextResponse.json(
            { success: false, error: "Task must be in progress to request completion" },
            { status: 400 }
          );
        }

        task.status = "completion_requested";
        task.completionRequestedAt = new Date();
        task.completionRequestNotes = completionRequestNotes;
        
        await task.save();

        await logActivity({
          userId: currentUser._id.toString(),
          activityType: ActivityTypes.TASK_COMPLETED,
          description: `Requested task completion: ${task.title} (${currentUser.role})`,
          metadata: {
            taskId: task._id,
            taskTitle: task.title,
          },
          ...getClientInfo(request),
        });

        return NextResponse.json({
          success: true,
          message: "Task completion requested",
          data: task,
        });
      }

      if (action === "approve_completion" || action === "reject_completion") {
        // Only the person who created the task can approve/reject
        if (task.assignedBy.toString() !== currentUser._id.toString()) {
          return NextResponse.json(
            { success: false, error: "Only the task creator can approve/reject completion" },
            { status: 403 }
          );
        }

        if (task.status !== "completion_requested") {
          return NextResponse.json(
            { success: false, error: "Task must have completion requested before approval/rejection" },
            { status: 400 }
          );
        }

        if (action === "approve_completion") {
          task.status = "approved";
          task.approvedAt = new Date();
          task.approvedBy = currentUser._id;
          task.approvalNotes = approvalNotes;
          
          await task.save();

          await logActivity({
            userId: currentUser._id.toString(),
            activityType: ActivityTypes.TASK_APPROVED,
            description: `Approved task completion: ${task.title} (${currentUser.role})`,
            metadata: {
              taskId: task._id,
              taskTitle: task.title,
            },
            ...getClientInfo(request),
          });

          return NextResponse.json({
            success: true,
            message: "Task completion approved",
            data: task,
          });
        } else {
          task.status = "rejected";
          task.approvalNotes = approvalNotes;
          
          await task.save();

          await logActivity({
            userId: currentUser._id.toString(),
            activityType: ActivityTypes.TASK_REJECTED,
            description: `Rejected task completion: ${task.title} (${currentUser.role})`,
            metadata: {
              taskId: task._id,
              taskTitle: task.title,
            },
            ...getClientInfo(request),
          });

          return NextResponse.json({
            success: true,
            message: "Task completion rejected",
            data: task,
          });
        }
      }
    }

    return NextResponse.json(
      { success: false, error: "Invalid action or insufficient permissions" },
      { status: 400 }
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