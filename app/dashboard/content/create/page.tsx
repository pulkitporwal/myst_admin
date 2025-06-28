"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Users } from "lucide-react";
import { ContentUpload } from "@/components/content-upload";
import { useApi } from "@/hooks/use-api";
import { TOAST_CONFIGS } from "@/lib/api-utils";
import { toast } from "sonner";

interface User {
  _id: string;
  fullName: string;
  userName: string;
  email: string;
  avatarURL: string;
}

export default function CreateContentPage() {
  const router = useRouter();
  const { get } = useApi();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const result = await get("/api/users", TOAST_CONFIGS.silent);
        if (result.success && result.data) {
          setUsers(result.data);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [get]);

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

      if (result.success) {
        toast.success("Content created successfully!");
        router.push("/dashboard/content");
      } else {
        toast.error(result.error || "Failed to create content");
      }
    } catch (error) {
      console.error("Error creating content:", error);
      toast.error("Failed to create content");
    }
  };

  const handleUploadError = (error: string) => {
    toast.error(error);
  };

  if (loading) {
    return (
      <div className="p-4 w-full h-full">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 w-full h-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create New Content</h1>
            <p className="text-muted-foreground">
              Upload and create content for any user profile
            </p>
          </div>
        </div>
      </div>

      {/* User Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Select User Profile
          </CardTitle>
          <CardDescription>
            Choose the user profile for which you want to create content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">User Profile</label>
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user profile" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      <div className="flex items-center gap-2">
                        <span>{user.fullName}</span>
                        <Badge variant="secondary">@{user.userName}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedUserId && (
              <div className="p-4 border rounded-lg bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {users.find(u => u._id === selectedUserId)?.fullName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      @{users.find(u => u._id === selectedUserId)?.userName}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content Upload */}
      {selectedUserId ? (
        <ContentUpload
          userId={selectedUserId}
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
        />
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Select a User Profile</h3>
            <p className="text-muted-foreground">
              Please select a user profile above to start creating content.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 