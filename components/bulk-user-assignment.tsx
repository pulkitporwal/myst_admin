"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCheck,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { handleAPICall, methodENUM } from "@/lib/api-utils";
import { toast } from "sonner";

interface UnassignedUser {
  _id: string;
  fullName: string;
  userName: string;
  email: string;
  avatarURL?: string;
  isActive: boolean;
  posts: number;
  followers: number;
  following: number;
}

interface BulkUserAssignmentProps {
  adminUserId: string;
  adminUserName: string;
  onAssignmentComplete: () => void;
}

export function BulkUserAssignment({
  adminUserId,
  adminUserName,
  onAssignmentComplete,
}: BulkUserAssignmentProps) {
  const [unassignedUsers, setUnassignedUsers] = useState<UnassignedUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUnassignedUsers();
  }, []);

  const fetchUnassignedUsers = async () => {
    setFetchingUsers(true);
    try {
      const data = await handleAPICall("/api/users/unassigned", methodENUM.GET);
      if (data) {
        setUnassignedUsers(data);
      }
    } catch (error) {
      console.error("Error fetching unassigned users:", error);
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(unassignedUsers.map(user => user._id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleBulkAssign = async () => {
    if (selectedUsers.length === 0) {
      return;
    }

    setLoading(true);
    try {
      // Assign each selected user to the admin
      const assignPromises = selectedUsers.map(userId =>
        handleAPICall("/api/users/assign", methodENUM.POST, {
          userId,
          adminUserId,
        })
      );

      const results = await Promise.all(assignPromises);
      const failedAssignments = results.filter(result => !result);
      const successfulAssignments = results.filter(result => result);

      if (failedAssignments.length === 0) {
        // Show success toast for bulk operation
        const successMessage = `Successfully assigned ${successfulAssignments.length} users to ${adminUserName}`;
        toast.success(successMessage);
        
        setSelectedUsers([]);
        onAssignmentComplete();
        fetchUnassignedUsers(); // Refresh the list
      } else {
        const errorMessage = failedAssignments.length === results.length 
          ? "Failed to assign any users" 
          : `Failed to assign ${failedAssignments.length} out of ${results.length} users`;
        
        toast.error(errorMessage);
        
        // Still refresh the list to show successful assignments
        if (successfulAssignments.length > 0) {
          fetchUnassignedUsers();
        }
      }
    } catch (error) {
      console.error("Error bulk assigning users:", error);
      toast.error("Failed to assign users");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingUsers) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Pending Profiles to Assign
          </CardTitle>
          <CardDescription>
            Loading unassigned users...
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

  if (unassignedUsers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Pending Profiles to Assign
          </CardTitle>
          <CardDescription>
            No unassigned profiles available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">All profiles have been assigned to admin users.</span>
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
          Pending Profiles to Assign
        </CardTitle>
        <CardDescription>
          Select profiles to assign to {adminUserName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Select All */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="select-all"
            checked={selectedUsers.length === unassignedUsers.length && unassignedUsers.length > 0}
            onCheckedChange={handleSelectAll}
          />
          <label
            htmlFor="select-all"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Select All ({unassignedUsers.length})
          </label>
        </div>

        {/* User List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {unassignedUsers.map((user) => (
            <div
              key={user._id}
              className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50"
            >
              <Checkbox
                id={user._id}
                checked={selectedUsers.includes(user._id)}
                onCheckedChange={(checked) => handleSelectUser(user._id, checked as boolean)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{user.fullName}</p>
                  <Badge variant="secondary" className="text-xs">
                    @{user.userName}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {user.email}
                </p>
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
          ))}
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleBulkAssign}
            disabled={loading || selectedUsers.length === 0}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4" />
                Assign {selectedUsers.length} Profile{selectedUsers.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 