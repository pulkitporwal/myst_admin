import mongoose, { Schema, Document, Types } from "mongoose";

export interface FollowDocument extends Document {
  creator_id: Types.ObjectId;
  follower_id: Types.ObjectId;
  is_approved: boolean;
  created_at: Date;
}

const followSchema = new Schema<FollowDocument>(
  {
    creator_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    follower_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    is_approved: {
      type: Boolean,
      default: false,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

const FollowModel = mongoose.model<FollowDocument>("Follow", followSchema);
export default FollowModel;
