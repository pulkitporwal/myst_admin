import mongoose, { Schema, Document, Types } from "mongoose";
import { SCORER_TYPE } from "../interfaces/score";


export interface ScoreDocument extends Document {
  content_id: Types.ObjectId;
  user_id: Types.ObjectId;
  scorer_type: SCORER_TYPE;
  score: number;
  created_at: Date;
}

const scoreSchema = new Schema<ScoreDocument>(
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
    scorer_type: {
      type: String,
      enum: Object.values(SCORER_TYPE),
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 10, 
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

scoreSchema.index({ user_id: 1, content_id: 1 }, { unique: true });

const ScoreModel = mongoose.model<ScoreDocument>("Score", scoreSchema);
export default ScoreModel;
