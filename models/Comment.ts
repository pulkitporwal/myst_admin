import mongoose, { Schema, Document, Types } from "mongoose";

export interface CommentDocument extends Document {
  comment_msg: string;
  created_at: Date;
  content_id: Types.ObjectId;
  user_id: Types.ObjectId;
  parent_comment_id?: Types.ObjectId | null;
}

const commentSchema = new Schema<CommentDocument>(
  {
    comment_msg: {
      type: String,
      required: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
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
    parent_comment_id: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
  },
  { versionKey: false, timestamps: true }
);

const CommentModel = mongoose.model<CommentDocument>("Comment", commentSchema);
export default CommentModel;
