import mongoose, { Schema, Document, Types } from "mongoose";

export interface StreakDocument extends Document {
  user_id: Types.ObjectId;
  streak_count: number;
  last_active_date: Date;
  is_break: boolean;
}

const streakSchema = new Schema<StreakDocument>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    streak_count: {
      type: Number,
      default: 0,
    },
    last_active_date: {
      type: Date,
      required: true,
    },
    is_break: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const StreakModel = mongoose.model<StreakDocument>("Streak", streakSchema);
export default StreakModel;
