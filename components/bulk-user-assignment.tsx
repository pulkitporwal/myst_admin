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
import { Checkbox } from "@/components/ui/checkbox";
import { UserCheck, Users, Loader2, AlertCircle } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { TOAST_CONFIGS } from "@/lib/api-utils";

interface UnassignedUser {
  _id: string;
  fullName: string;
  userName: string;
  email: string;
  avatarURL: string;
  interestIn: Array<{ interest: string }>;
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
  
  const { loading, get, post } = useApi();

  useEffect(() => {
    fetchUnassignedUsers();
  }, []);

  const fetchUnassignedUsers = async () => {
    setFetchingUsers(true);
    try {
      const result = await get("/api/users/unassigned", TOAST_CONFIGS.fetch);
      if (result.success && result.data) {
        setUnassignedUsers(result.data);
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

    try {
      // Assign each selected user to the admin
      const assignPromises = selectedUsers.map(userId =>
        post("/api/users/assign", {
          userId,
          adminUserId,
        }, TOAST_CONFIGS.silent) // Use silent to avoid multiple toasts
      );

      const results = await Promise.all(assignPromises);
      const failedAssignments = results.filter(result => !result.success);
      const successfulAssignments = results.filter(result => result.success);

      if (failedAssignments.length === 0) {
        // Show success toast for bulk operation
        const successMessage = `Successfully assigned ${successfulAssignments.length} users to ${adminUserName}`;
        // We'll use the toast directly here since we used silent config
        const { toast } = await import('sonner');
        toast.success(successMessage);
        
        setSelectedUsers([]);
        onAssignmentComplete();
        fetchUnassignedUsers(); // Refresh the list
      } else {
        const errorMessage = failedAssignments.length === results.length 
          ? "Failed to assign any users" 
          : `Failed to assign ${failedAssignments.length} out of ${results.length} users`;
        
        // Show error toast for bulk operation
        const { toast } = await import('sonner');
        toast.error(errorMessage);
        
        // Log detailed errors for debugging
        failedAssignments.forEach(failure => {
          console.error(`Failed to assign user:`, failure.error);
        });
        
        // Still refresh the list to show successful assignments
        if (successfulAssignments.length > 0) {
          fetchUnassignedUsers();
        }
      }
    } catch (error) {
      console.error("Error bulk assigning users:", error);
      const { toast } = await import('sonner');
      toast.error("Failed to assign users");
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