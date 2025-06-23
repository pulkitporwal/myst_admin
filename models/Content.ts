import mongoose, { Schema, Document, Types } from "mongoose";

export enum CONTENT_TYPE {
  Story = "story",
  Post = "post",
}

export interface ContentDocument extends Document {
  user_id: Types.ObjectId;
  content_url: string;
  thumbnail_url?: string;
  caption?: string;
  category?: Types.ObjectId[];
  content_type: CONTENT_TYPE;
  location?: string;
  tagUser: string;
  media_type: String;
  expires_at?: Date;
  duration?: number;
}

const contentSchema = new Schema<ContentDocument>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content_url: {
      type: String,
      required: true,
    },
    thumbnail_url: {
      type: String,
    },
    caption: {
      type: String,
    },
    category: [
      {
        type: Schema.Types.ObjectId,
        ref: "Interest",
      },
    ],
    content_type: {
      type: String,
      enum: Object.values(CONTENT_TYPE),
      required: true,
    },
    media_type: {
      type: String,
    },
    location: {
      type: String,
    },
    tagUser: {
      type: String,
    },
    expires_at: {
      type: Date,
    },
    duration: {
      type: Number,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const ContentModel = mongoose.models.Content || mongoose.model<ContentDocument>("Content", contentSchema);
