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
  // Enhanced metadata fields
  cloudinary_public_id?: string;
  upload_metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    bytes: number;
    original_filename: string;
    format: string;
    resource_type: string;
    aspect_ratio?: number;
    fps?: number;
    bitrate?: number;
    codec?: string;
  };
  // Additional content details
  title?: string;
  description?: string;
  tags?: string[];
  is_public: boolean;
  is_featured: boolean;
  view_count: number;
  like_count: number;
  share_count: number;
  comment_count: number;
  // Video specific fields
  video_metadata?: {
    duration: number;
    resolution: string;
    fps: number;
    bitrate: number;
    codec: string;
    audio_codec?: string;
    audio_bitrate?: number;
    audio_channels?: number;
  };
  // Image specific fields
  image_metadata?: {
    width: number;
    height: number;
    format: string;
    color_space?: string;
    exif_data?: any;
  };
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
    // Enhanced metadata fields
    cloudinary_public_id: {
      type: String,
    },
    upload_metadata: {
      width: Number,
      height: Number,
      duration: Number,
      bytes: Number,
      original_filename: String,
      format: String,
      resource_type: String,
      aspect_ratio: Number,
      fps: Number,
      bitrate: Number,
      codec: String,
    },
    // Video specific fields
    video_metadata: {
      duration: Number,
      resolution: String,
      fps: Number,
      bitrate: Number,
      codec: String,
      audio_codec: String,
      audio_bitrate: Number,
      audio_channels: Number,
    },
    // Image specific fields
    image_metadata: {
      width: Number,
      height: Number,
      format: String,
      color_space: String,
      exif_data: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const ContentModel = mongoose.models.Content || mongoose.model<ContentDocument>("Content", contentSchema);
