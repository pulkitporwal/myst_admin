import mongoose, { Schema, Document } from "mongoose";

export interface InterestDocument extends Document {
  interest: string;
  description: string;
}

const interestSchema = new Schema<InterestDocument>(
  {
    interest: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export const InterestModel =
  mongoose.models.Interest || mongoose.model<InterestDocument>("Interest", interestSchema);
