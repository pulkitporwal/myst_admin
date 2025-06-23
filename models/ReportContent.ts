import mongoose, { Schema, Document, Types } from "mongoose";

export enum REPORT_STATUS {
  Pending = "pending",
  Resolved = "resolved",
  InProgress = "inprogress",
}

interface ContentReportDocument extends Document {
  content_id: Types.ObjectId;
  user_id: Types.ObjectId;
  reason: string;
  status: REPORT_STATUS;
  created_at: Date;
}

const contentReportSchema = new Schema<ContentReportDocument>(
  {
    content_id: {
      type: Schema.Types.ObjectId,
      ref: "Content",
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(REPORT_STATUS),
      default: REPORT_STATUS.Pending,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

contentReportSchema.index({ user_id: 1, content_id: 1 }, { unique: true });

export const ContentReportModel = mongoose.models.ContentReport || mongoose.model("ContentReport", contentReportSchema)

