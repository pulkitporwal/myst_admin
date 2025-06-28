# Content Creation System Guide

## Overview

The Myst Admin Dashboard now includes a comprehensive content creation system that allows you to upload and manage content for user profiles with detailed metadata capture.

## Features

### 🎯 **Comprehensive Content Creation**
- **File Upload**: Support for images (JPEG, PNG, GIF, WEBP, BMP, TIFF) and videos (MP4, MOV, AVI, WEBM, MKV, FLV, WMV, M4V)
- **File Size**: Up to 100MB per file
- **Real-time Progress**: Visual upload progress with percentage tracking

### 📝 **Detailed Metadata Capture**
- **Title**: Content title (required, max 100 characters)
- **Caption**: Compelling caption (required, max 500 characters)
- **Description**: Detailed description (optional, max 1000 characters)
- **Content Type**: Post or Story
- **Location**: Where content was created (optional, max 100 characters)
- **Tag Users**: Comma-separated usernames to tag (optional, max 200 characters)
- **Tags**: Comma-separated tags for categorization (optional, max 300 characters)
- **Category**: Predefined interest categories (optional)

### 🎬 **Video-Specific Metadata**
When uploading videos, the system automatically captures:
- **Duration**: Video length in seconds
- **Resolution**: Width x Height pixels
- **FPS**: Frames per second
- **Bitrate**: Video bitrate
- **Codec**: Video codec information
- **Aspect Ratio**: Video aspect ratio

### 🖼️ **Image-Specific Metadata**
When uploading images, the system captures:
- **Dimensions**: Width and height in pixels
- **Format**: Image format (JPEG, PNG, etc.)
- **File Size**: Size in bytes

### 🔒 **Visibility Controls**
- **Public/Private**: Toggle content visibility
- **Featured Content**: Mark content as featured

## How to Use

### Method 1: From Content Management Page
1. Navigate to **Dashboard > Content**
2. Click **"Create Content"** button
3. Select a user profile from the dropdown
4. Upload your media file
5. Fill in all required metadata
6. Click **"Save Content"**

### Method 2: From User Profile Page
1. Navigate to **Dashboard > Myst Profiles**
2. Click on a specific user profile
3. Go to **"Content Management"** tab
4. Use the content upload component
5. Fill in metadata and save

## Database Schema

The enhanced Content model includes:

```typescript
interface Content {
  user_id: ObjectId;
  content_url: string;
  thumbnail_url?: string;
  title?: string;
  caption?: string;
  description?: string;
  content_type: "story" | "post";
  location?: string;
  tagUser: string;
  tags?: string[];
  category?: ObjectId[];
  media_type: string;
  cloudinary_public_id?: string;
  is_public: boolean;
  is_featured: boolean;
  
  // Upload metadata
  upload_metadata: {
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
  
  // Video-specific metadata
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
  
  // Image-specific metadata
  image_metadata?: {
    width: number;
    height: number;
    format: string;
    color_space?: string;
    exif_data?: any;
  };
  
  // Engagement metrics
  view_count: number;
  like_count: number;
  share_count: number;
  comment_count: number;
}
```

## API Endpoints

### Content Management
- `GET /api/content` - List all content (with permissions)
- `POST /api/content` - Create new content
- `GET /api/content/[id]` - Get specific content
- `PUT /api/content/[id]` - Update content
- `DELETE /api/content/[id]` - Delete content
- `GET /api/content/user/[userId]` - Get content for specific user

### Interests/Categories
- `GET /api/interests` - List all available interests for categorization

## Setup Instructions

### 1. Seed Default Interests
Run the seeding script to populate default categories:

```bash
npm run seed-interests
```

This will create 20 default interest categories including:
- Technology, Fashion, Food, Travel, Fitness
- Music, Art, Business, Education, Sports
- Lifestyle, Gaming, Beauty, Pets, DIY
- Photography, Comedy, News, Science, Nature

### 2. Environment Variables
Ensure your Cloudinary environment variables are set:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

### 3. Permissions
The system uses role-based permissions:
- `CONTENT_CREATE_ALL_USER` - Can create content for any user
- `CONTENT_CREATE_ASSIGNED_USER` - Can create content for assigned users only
- `CONTENT_UPDATE_ALL_USER` - Can update any content
- `CONTENT_DELETE_ALL_USER` - Can delete any content
- `CONTENT_VIEW` - Can view content

## Validation Rules

### Required Fields
- **File Upload**: Must upload a media file
- **Title**: Required, max 100 characters
- **Caption**: Required, max 500 characters

### Optional Fields
- **Description**: Max 1000 characters
- **Location**: Max 100 characters
- **Tag Users**: Max 200 characters
- **Tags**: Max 300 characters
- **Category**: Select from predefined interests

### File Validation
- **Supported Formats**: JPEG, PNG, GIF, WEBP, BMP, TIFF, MP4, MOV, AVI, WEBM, MKV, FLV, WMV, M4V
- **File Size**: Maximum 100MB
- **Upload Method**: Drag & drop or click to select

## Error Handling

The system provides comprehensive error handling:
- **Upload Errors**: Detailed error messages for failed uploads
- **Validation Errors**: Real-time form validation with error messages
- **Network Errors**: Graceful handling of connection issues
- **Permission Errors**: Clear permission requirement messages

## Best Practices

1. **File Optimization**: Compress large files before upload for better performance
2. **Metadata**: Fill in comprehensive metadata for better content organization
3. **Tags**: Use relevant tags to improve content discoverability
4. **Categories**: Select appropriate categories for better content organization
5. **Descriptions**: Write detailed descriptions to provide context

## Troubleshooting

### Common Issues

1. **Upload Fails**: Check file size and format compatibility
2. **Categories Not Loading**: Run the seeding script to populate interests
3. **Permission Errors**: Ensure user has appropriate content creation permissions
4. **Cloudinary Errors**: Verify Cloudinary environment variables are correct

### Support

For technical support or feature requests, please contact the development team. 