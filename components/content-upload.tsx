"use client";

import { useState, useEffect } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  X,
  Image,
  Video,
  FileText,
  MapPin,
  Users,
  Tag,
  Hash,
  Eye,
  EyeOff,
  Star,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Progress } from "./ui/progress";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Collapsible, CollapsibleContent } from "./ui/collapsible";
import { CollapsibleTrigger } from "@radix-ui/react-collapsible";

// Define content types
const CONTENT_TYPE = {
  Story: "story",
  Post: "post",
} as const;

// File type validation
const ALLOWED_IMAGE_FORMATS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "tiff",
];
const ALLOWED_VIDEO_FORMATS = [
  "mp4",
  "mov",
  "avi",
  "webm",
  "mkv",
  "flv",
  "wmv",
  "m4v",
];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

interface CloudinaryResult {
  public_id: string;
  secure_url: string;
  format: string;
  width?: number;
  height?: number;
  resource_type: string;
  duration?: number;
  thumbnail_url?: string;
  bytes: number;
  original_filename: string;
  aspect_ratio?: number;
  fps?: number;
  bitrate?: number;
  codec?: string;
}

interface Interest {
  _id: string;
  interest: string;
  description: string;
}

interface ContentUploadProps {
  userId: string;
  onUploadSuccess: (contentData: any) => void;
  onUploadError: (error: string) => void;
}

export function ContentUpload({
  userId,
  onUploadSuccess,
  onUploadError,
}: ContentUploadProps) {
  const [uploadResult, setUploadResult] = useState<CloudinaryResult | null>(
    null
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loadingInterests, setLoadingInterests] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    title: "",
    caption: "",
    content_type: CONTENT_TYPE.Post,
    location: "",
    tagUser: "",
    category: "",
  });

  // Fetch available interests for category selection
  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const response = await fetch("/api/interests");
        if (response.ok) {
          const { data } = await response.json();
          setInterests(data || []);
        } else {
          console.warn(
            "Failed to fetch interests, category selection will be disabled"
          );
        }
      } catch (error) {
        console.error("Failed to fetch interests:", error);
      } finally {
        setLoadingInterests(false);
      }
    };

    fetchInterests();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!uploadResult) {
      newErrors.file = "Please upload a file first";
    }

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length > 100) {
      newErrors.title = "Title must be less than 100 characters";
    }

    if (!formData.caption.trim()) {
      newErrors.caption = "Caption is required";
    } else if (formData.caption.length > 500) {
      newErrors.caption = "Caption must be less than 500 characters";
    }

    if (formData.location.length > 100) {
      newErrors.location = "Location must be less than 100 characters";
    }

    if (formData.tagUser.length > 200) {
      newErrors.tagUser = "Tagged users must be less than 200 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUploadSuccess = (result: any) => {
    const uploadData: CloudinaryResult = {
      public_id: result.info.public_id,
      secure_url: result.info.secure_url,
      format: result.info.format,
      width: result.info.width,
      height: result.info.height,
      resource_type: result.info.resource_type,
      duration: result.info.duration,
      thumbnail_url: result.info.thumbnail_url,
      bytes: result.info.bytes,
      original_filename: result.info.original_filename,
      aspect_ratio: result.info.aspect_ratio,
      fps: result.info.fps,
      bitrate: result.info.bitrate,
      codec: result.info.codec,
    };

    setUploadResult(uploadData);
    setUploading(false);
    setUploadProgress(100);
    setErrors({});

    console.log(uploadData);

    toast.success("File uploaded successfully!");
  };

  const handleUploadError = (error: any) => {
    setUploading(false);
    setUploadProgress(0);
    const errorMessage = error.message || "Upload failed";
    onUploadError(errorMessage);
    toast.error(errorMessage);
  };

  const handleUploadStart = () => {
    setUploading(true);
    setUploadProgress(0);
    setErrors({}); // Clear errors when starting new upload
  };

  const handleProgress = (progress: number) => {
    setUploadProgress(progress);
  };

  const handleSaveContent = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before saving");
      return;
    }

    setSaving(true);
    try {
      // Prepare metadata based on content type
      const isVideo = uploadResult!.resource_type === "video";
      const isImage = uploadResult!.resource_type === "image";

      const contentData = {
        user_id: userId,
        content_url: uploadResult!.secure_url,
        thumbnail_url: uploadResult!.thumbnail_url || uploadResult!.secure_url,
        title: formData.title.trim(),
        caption: formData.caption.trim(),
        content_type: formData.content_type,
        location: formData.location.trim(),
        tagUser: formData.tagUser.trim(),
        media_type: `${uploadResult!.resource_type}/${uploadResult!.format}`,
        category: formData.category ? [formData.category] : [],
        cloudinary_public_id: uploadResult!.public_id,
        upload_metadata: {
          width: uploadResult!.width,
          height: uploadResult!.height,
          duration: uploadResult!.duration,
          bytes: uploadResult!.bytes,
          original_filename: uploadResult!.original_filename,
          format: uploadResult!.format,
          resource_type: uploadResult!.resource_type,
          aspect_ratio: uploadResult!.aspect_ratio,
          fps: uploadResult!.fps,
          bitrate: uploadResult!.bitrate,
          codec: uploadResult!.codec,
        },
        // Video specific metadata
        ...(isVideo && {
          video_metadata: {
            duration: uploadResult!.duration || 0,
            resolution: `${uploadResult!.width}x${uploadResult!.height}`,
            fps: uploadResult!.fps || 0,
            bitrate: uploadResult!.bitrate || 0,
            codec: uploadResult!.codec || "unknown",
          },
        }),
        // Image specific metadata
        ...(isImage && {
          image_metadata: {
            width: uploadResult!.width || 0,
            height: uploadResult!.height || 0,
            format: uploadResult!.format,
          },
        }),
      };

      onUploadSuccess(contentData);

      // Reset form
      setUploadResult(null);
      setFormData({
        title: "",
        caption: "",
        content_type: CONTENT_TYPE.Post,
        location: "",
        tagUser: "",
        category: "",
      });
      setUploadProgress(0);
      setErrors({});
      toast.success("Content saved successfully!");
    } catch (error) {
      onUploadError("Failed to save content");
    } finally {
      setSaving(false);
    }
  };

  const getFileTypeIcon = (resourceType: string) => {
    if (resourceType === "video") {
      return <Video className="h-4 w-4" />;
    }
    return <Image className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileTypeColor = (resourceType: string) => {
    if (resourceType === "video") {
      return "text-blue-600";
    }
    return "text-green-600";
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Collapsible className="w-full">
      <Card className="w-full">
        <CollapsibleTrigger className="flex flex-col items-center justify-center gap-2 w-full">
          <CardHeader className="w-full flex flex-col items-center justify-center">
            <CardTitle className="flex w-full justify-center items-center gap-6">
              <Upload className="h-5 w-5" />
              <h4>Create New Content</h4>
            </CardTitle>
            <CardDescription className="">
              Upload and create new content with comprehensive metadata.
              Supported formats: JPEG, PNG, GIF, WEBP, MP4, MOV, AVI, WEBM, MKV
              (max 100MB)
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* File Upload Section */}
            <div className="space-y-3">
              <Label>Select Media File</Label>
              {!uploadResult ? (
                <CldUploadWidget
                  uploadPreset={
                    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
                  }
                  onSuccess={handleUploadSuccess}
                  onError={handleUploadError}
                  onOpen={handleUploadStart}
                  options={{
                    maxFiles: 1,
                    maxFileSize: MAX_FILE_SIZE,
                    folder: "myst-content",
                    resourceType: "auto",
                    clientAllowedFormats: [
                      ...ALLOWED_IMAGE_FORMATS,
                      ...ALLOWED_VIDEO_FORMATS,
                    ],
                    maxChunkSize: 20000000, // 20MB chunks for large files
                    showAdvancedOptions: false,
                    cropping: false,
                    multiple: false,
                    sources: ["local", "camera"],
                  }}
                >
                  {({ open }) => (
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
                        uploading
                          ? "border-blue-300 bg-blue-50"
                          : errors.file
                          ? "border-red-300 bg-red-50"
                          : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50"
                      }`}
                      onClick={() => !uploading && open()}
                    >
                      {uploading ? (
                        <div className="space-y-3">
                          <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-600" />
                          <p className="text-sm font-medium text-blue-600">
                            Uploading...
                          </p>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                          <p className="text-sm font-medium mb-1">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground mb-4">
                            Supports images and videos up to 100MB
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              open();
                            }}
                            disabled={uploading}
                          >
                            Choose File
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </CldUploadWidget>
              ) : (
                <div className="border rounded-lg p-4 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-full bg-muted ${getFileTypeColor(
                          uploadResult.resource_type
                        )}`}
                      >
                        {getFileTypeIcon(uploadResult.resource_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {uploadResult.original_filename}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(uploadResult.bytes)} •{" "}
                          {uploadResult.format.toUpperCase()}
                        </p>
                        {uploadResult.width && uploadResult.height && (
                          <p className="text-xs text-muted-foreground">
                            {uploadResult.width} × {uploadResult.height} pixels
                          </p>
                        )}
                        {uploadResult.duration && (
                          <p className="text-xs text-muted-foreground">
                            Duration: {formatDuration(uploadResult.duration)}
                          </p>
                        )}
                        {uploadResult.fps && (
                          <p className="text-xs text-muted-foreground">
                            FPS: {uploadResult.fps}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUploadResult(null);
                        setErrors({});
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {errors.file && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.file}
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Uploading...</span>
                  <span className="text-muted-foreground">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Content Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="title">
                    Title *{" "}
                    <span className="text-muted-foreground">
                      ({formData.title.length}/100)
                    </span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Enter content title..."
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className={errors.title ? "border-red-500" : ""}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500">{errors.title}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="caption">
                    Caption *{" "}
                    <span className="text-muted-foreground">
                      ({formData.caption.length}/500)
                    </span>
                  </Label>
                  <Textarea
                    id="caption"
                    placeholder="Enter a compelling caption for your content..."
                    value={formData.caption}
                    onChange={(e) =>
                      setFormData({ ...formData, caption: e.target.value })
                    }
                    rows={3}
                    className={errors.caption ? "border-red-500" : ""}
                  />
                  {errors.caption && (
                    <p className="text-sm text-red-500">{errors.caption}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content_type">Content Type *</Label>
                  <Select
                    value={formData.content_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, content_type: value as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CONTENT_TYPE.Post}>Post</SelectItem>
                      <SelectItem value={CONTENT_TYPE.Story}>Story</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location and Tags */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Location & Tags</h3>

                <div className="space-y-2">
                  <Label htmlFor="location">
                    <MapPin className="h-4 w-4 inline mr-2" />
                    Location{" "}
                    <span className="text-muted-foreground">
                      ({formData.location.length}/100)
                    </span>
                  </Label>
                  <Input
                    id="location"
                    placeholder="Where was this content created?"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className={errors.location ? "border-red-500" : ""}
                  />
                  {errors.location && (
                    <p className="text-sm text-red-500">{errors.location}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagUser">
                    <Users className="h-4 w-4 inline mr-2" />
                    Tag Users{" "}
                    <span className="text-muted-foreground">
                      ({formData.tagUser.length}/200)
                    </span>
                  </Label>
                  <Input
                    id="tagUser"
                    placeholder="Enter usernames to tag (comma separated)..."
                    value={formData.tagUser}
                    onChange={(e) =>
                      setFormData({ ...formData, tagUser: e.target.value })
                    }
                    className={errors.tagUser ? "border-red-500" : ""}
                  />
                  {errors.tagUser && (
                    <p className="text-sm text-red-500">{errors.tagUser}</p>
                  )}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-4">

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData?.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingInterests ? (
                        <SelectItem value="no-value" disabled>
                          Loading categories...
                        </SelectItem>
                      ) : interests?.length > 0 ? (
                        interests.map((interest) => (
                          <SelectItem key={interest._id} value={interest._id}>
                            {interest.interest}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          No categories available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSaveContent}
                className="w-full"
                disabled={!uploadResult || saving}
                size="lg"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving Content...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Save Content
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
