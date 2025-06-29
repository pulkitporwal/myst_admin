import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completion_requested", "completed", "approved", "rejected"],
      default: "pending",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    completedAt: {
      type: Date,
    },
    approvedAt: {
      type: Date,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
    },
    completionRequestedAt: {
      type: Date,
    },
    completionNotes: {
      type: String,
    },
    approvalNotes: {
      type: String,
    },
    completionRequestNotes: {
      type: String,
    },
  },
  { timestamps: true }
);

// Index for better query performance
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ assignedBy: 1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ status: 1, priority: 1 });

export const TaskModel = mongoose.models.Task || mongoose.model("Task", TaskSchema); 