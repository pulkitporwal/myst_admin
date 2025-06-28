"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Users,
  FileText,
  Video,
  Eye,
  ImageIcon,
} from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { TOAST_CONFIGS } from "@/lib/api-utils";
import { toast } from "sonner";
import { ContentUpload } from "@/components/content-upload";
import Image from "next/image";

interface UserProfile {
  _id: string;
  fullName: string;
  userName: string;
  email: string;
  mobileNumber: number;
  bio: string;
  avatarURL: string;
  isActive: boolean;
  isVerified: boolean;
  posts: number;
  followers: number;
  following: number;
  rockets: number;
  wallet: number;
  socialLinks: string[];
  interestIn: Array<{
    _id: string;
    interest: string;
    description: string;
  }>;
  assignedTo: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
  createdAt: string;
}

interface Content {
  _id: string;
  user_id: string;
  content_url: string;
  thumbnail_url?: string;
  caption?: string;
  content_type: "story" | "post";
  media_type: string;
  location?: string;
  tagUser: string;
  cloudinary_public_id?: string;
  upload_metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    bytes: number;
    original_filename: string;
  };
  createdAt: string;
}

export default function ProfileDetailPage() {
  const params = useParams();
  const userId = params.id as string;
  const { get, post } = useApi();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      const response = await fetch(`/api/users/${userId}`);
      const { data } = await response.json();
      setProfile(data);
    };

    const fetchProfileContent = async () => {
      const response = await fetch(`/api/content/user/${userId}`);
      const { data } = await response.json();
      setContent(data);
    };

    fetchProfileData();
    setLoading(false);
    fetchProfileContent();
  }, []);

  console.log(profile);
  console.log(content);

  const handleUploadSuccess = async (contentData: any) => {
    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contentData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Content saved successfully");

        const contentResponse = await fetch(`/api/content/user/${userId}`);
        const contentResult = await contentResponse.json();

        if (contentResponse.ok && contentResult.success && contentResult.data) {
          setContent(contentResult.data);
        } else {
          toast.error("Failed to refresh content");
        }
      } else {
        toast.error(result.message || "Failed to save content");
      }
    } catch (error) {
      console.error("Error saving content:", error);
      toast.error("Failed to save content");
    }
  };

  const handleUploadError = (error: string) => {
    toast.error(error);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getFileTypeIcon = (mediaType: string) => {
    if (mediaType.startsWith("video/")) {
      return <Video className="h-4 w-4" />;
    }
    return <ImageIcon className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="p-4 w-full h-full space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 w-full h-full">
        <div className="text-center py-8">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Profile not found</h3>
          <p className="text-muted-foreground">
            The requested profile could not be found or you don't have
            permission to view it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 w-full h-full space-y-6">
      {/* Header */}
      <div className="flex justify-start items-center gap-6">
        <Image
          alt={profile.email}
          src={profile.avatarURL || "/default-avatar.svg"}
          width={150}
          height={150}
          className="rounded-full overflow-hidden"
        />
        <div>
          <h1 className="text-2xl font-bold mb-2">{profile.fullName}</h1>
          <p className="text-muted-foreground">
            @{profile.userName} • {profile.isActive ? "Active" : "Inactive"}
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Profile Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Posts</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile.posts}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Followers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile.followers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Following</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile.following}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Wallet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile.wallet}</div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profile.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profile.mobileNumber}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Joined {formatDate(profile.createdAt)}
                  </span>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-1">Bio</p>
                  <p className="text-sm text-muted-foreground">{profile.bio}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Interests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.interestIn?.map((interest, i) => (
                    <Badge key={i} className="capitalize" variant="secondary">
                      {interest.interest}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          {/* Upload Section */}
          <ContentUpload
            userId={profile._id}
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />

          {/* Content List */}
          <Card>
            <CardHeader>
              <CardTitle>Content History</CardTitle>
              <CardDescription>
                Recent content uploaded for this profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              {content.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No content yet</h3>
                  <p className="text-muted-foreground">
                    Upload the first piece of content for this profile.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {content.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center space-x-4 p-4 border rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        {item.thumbnail_url ? (
                          <img
                            src={item.thumbnail_url}
                            alt="Content thumbnail"
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                            {getFileTypeIcon(item.media_type)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant="outline">{item.content_type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(item.createdAt)}
                          </span>
                        </div>
                        {item.caption && (
                          <p className="text-sm text-muted-foreground truncate">
                            {item.caption}
                          </p>
                        )}
                        {item.location && (
                          <p className="text-xs text-muted-foreground">
                            📍 {item.location}
                          </p>
                        )}
                        {item.upload_metadata && (
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(item.upload_metadata.bytes)} •{" "}
                            {item.media_type}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(item.content_url, "_blank")
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
