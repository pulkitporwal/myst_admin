import mongoose, { Schema, Document, Types } from "mongoose";

export enum REACTION_TYPE {
  Rocket = "rocket",
  Trash = "trash",
  Share = "share",
}
export interface ReactionDocument extends Document {
  reaction_type: REACTION_TYPE;
  created_at: Date;
  user_id: Types.ObjectId;

  content_id?: Types.ObjectId;
  comment_id?: Types.ObjectId;

  shared_with?: Types.ObjectId[];
}

const reactionSchema = new Schema<ReactionDocument>(
  {
    reaction_type: {
      type: String,
      enum: Object.values(REACTION_TYPE),
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content_id: {
      type: Schema.Types.ObjectId,
      ref: "Content",
      default: null,
    },
    comment_id: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    shared_with: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

reactionSchema.index(
  { user_id: 1, content_id: 1 },
  {
    unique: true,
    partialFilterExpression: { content_id: { $type: "objectId" } },
  }
);
reactionSchema.index(
  { user_id: 1, comment_id: 1 },
  {
    unique: true,
    partialFilterExpression: { comment_id: { $type: "objectId" } },
  }
);
reactionSchema.index(
  { user_id: 1, content_id: 1, reaction_type: 1 },
  {
    unique: true,
    partialFilterExpression: {
      content_id: { $type: "objectId" },
      reaction_type: "share",
    },
  }
);

const ReactionModel = mongoose.model<ReactionDocument>(
  "Reaction",
  reactionSchema
);
export default ReactionModel;
