"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Users, Loader2, AlertCircle, UserX } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { TOAST_CONFIGS } from "@/lib/api-utils";

interface AssignedUser {
  _id: string;
  fullName: string;
  userName: string;
  email: string;
  avatarURL: string;
  interestIn: Array<{ interest: string }>;
  isActive: boolean;
  isVerified: boolean;
  posts: number;
  followers: number;
  following: number;
  wallet: number;
}

interface AssignedProfilesListProps {
  adminUserId: string;
  adminUserName: string;
  onAssignmentChange: () => void;
}

export function AssignedProfilesList({
  adminUserId,
  adminUserName,
  onAssignmentChange,
}: AssignedProfilesListProps) {
  const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  
  const { loading, get, del } = useApi();

  useEffect(() => {
    fetchAssignedUsers();
  }, []);

  const fetchAssignedUsers = async () => {
    setFetchingUsers(true);
    try {
      const result = await get(`/api/users/assigned/${adminUserId}`, TOAST_CONFIGS.fetch);
      if (result.success && result.data) {
        setAssignedUsers(result.data);
      }
    } catch (error) {
      console.error("Error fetching assigned users:", error);
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleUnassignUser = async (userId: string, userName: string) => {
    const result = await del(`/api/users/assign?userId=${userId}`, {
      ...TOAST_CONFIGS.unassign,
      successMessage: `Successfully unassigned ${userName}`,
      onSuccess: () => {
        onAssignmentChange();
        fetchAssignedUsers(); // Refresh the list
      },
    });
  };

  if (fetchingUsers) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assigned Profiles
          </CardTitle>
          <CardDescription>
            Loading assigned users...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (assignedUsers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assigned Profiles
          </CardTitle>
          <CardDescription>
            No profiles assigned to {adminUserName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">No profiles have been assigned to this admin user yet.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Assigned Profiles
        </CardTitle>
        <CardDescription>
          Profiles currently assigned to {adminUserName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {assignedUsers.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
            >
              <div className="flex items-center space-x-3 flex-1">
                <img
                  src={user.avatarURL || "/default-avatar.svg"}
                  alt={user.fullName}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{user.fullName}</p>
                    <Badge variant="secondary" className="text-xs">
                      @{user.userName}
                    </Badge>
                    {user.isVerified && (
                      <Badge variant="default" className="text-xs">
                        Verified
                      </Badge>
                    )}
                    {!user.isActive && (
                      <Badge variant="destructive" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span>{user.posts} posts</span>
                    <span>{user.followers} followers</span>
                    <span>{user.following} following</span>
                    <span>${user.wallet} wallet</span>
                  </div>
                  {user.interestIn && user.interestIn.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {user.interestIn.slice(0, 3).map((interest, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {interest.interest}
                        </Badge>
                      ))}
                      {user.interestIn.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{user.interestIn.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUnassignUser(user._id, user.fullName)}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserX className="h-4 w-4" />
                )}
                Unassign
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 