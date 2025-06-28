import mongoose, { Schema, Document } from "mongoose";

export interface UserDocument extends Document {
  fullName: string;
  userName: string;
  gender: string;
  dob: string;
  avatarURL: string;
  mobileNumber: number;
  email: string;
  bio: string;
  isActive: boolean;
  isVerified: boolean;
  interestIn: mongoose.Types.ObjectId[];
  posts: number;
  followers: number;
  following: number;
  rockets: number;
  wallet: number;
  socialLinks: string[];
  fcmToken?: string;
  referralCode?: string;
  assignedTo?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    fullName: { type: String, required: true },
    userName: { type: String, required: true, unique: true },
    gender: {
      type: String,
      required: true,
      enum: ["male", "female", "other", "unspecified"],
    },
    dob: { type: String, required: true },
    avatarURL: { type: String },
    mobileNumber: { type: Number, required: true },
    email: { type: String, required: true },
    bio: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    interestIn: [{ type: mongoose.Schema.Types.ObjectId, ref: "Interest" }],
    wallet: { type: Number, default: 100 },
    socialLinks: { type: [String], default: [] },
    referralCode: { type: String },
    fcmToken: { type: String },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export const UserModel =
  mongoose.models.User || mongoose.model<UserDocument>("User", userSchema);
