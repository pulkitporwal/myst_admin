"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserCheck, UserX, Loader2 } from "lucide-react";
import { handleAPICall, methodENUM } from "@/lib/api-utils";

interface AdminUser {
  _id: string;
  fullName: string;
  email: string;
  role: string;
}

interface UserAssignmentDialogProps {
  userId: string;
  userName: string;
  currentAssignment?: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  } | null;
  onAssignmentChange: () => void;
  triggerLabel?: string;
}

export function UserAssignmentDialog({
  userId,
  userName,
  currentAssignment,
  onAssignmentChange,
  triggerLabel = "Assign User"
}: UserAssignmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [selectedAdminUserId, setSelectedAdminUserId] = useState<string>("");
  const [fetchingAdmins, setFetchingAdmins] = useState(false);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (open) {
      fetchAdminUsers();
    }
  }, [open]);

  const fetchAdminUsers = async () => {
    setFetchingAdmins(true);
    try {
      const data = await handleAPICall("/api/admin-users", methodENUM.GET);
      if (data) {
        // Filter to only show managers and admins (not super-admin)
        const filteredAdmins = data.filter((admin: AdminUser) => 
          ["admin", "manager"].includes(admin.role)
        );
        setAdminUsers(filteredAdmins);
      }
    } catch (error) {
      console.error("Error fetching admin users:", error);
    } finally {
      setFetchingAdmins(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedAdminUserId) {
      return;
    }

    setLoading(true);
    try {
      const data = await handleAPICall("/api/users/assign", methodENUM.POST, {
        userId,
        adminUserId: selectedAdminUserId,
      });
      
      if (data) {
        onAssignmentChange();
        setOpen(false);
        setSelectedAdminUserId("");
      }
    } catch (error) {
      console.error("Error assigning user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async () => {
    setLoading(true);
    try {
      const data = await handleAPICall(`/api/users/assign?userId=${userId}`, methodENUM.DELETE);
      if (data) {
        onAssignmentChange();
        setOpen(false);
      }
    } catch (error) {
      console.error("Error unassigning user:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {currentAssignment ? (
            <>
              <UserCheck className="h-4 w-4 mr-2" />
              Reassign
            </>
          ) : (
            <>
              <UserCheck className="h-4 w-4 mr-2" />
              {triggerLabel}
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {currentAssignment ? "Reassign User" : "Assign User"}
          </DialogTitle>
          <DialogDescription>
            {currentAssignment 
              ? `Currently assigned to ${currentAssignment.fullName} (${currentAssignment.role})`
              : `Assign ${userName} to an admin user for management`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {currentAssignment && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Badge variant="secondary">
                Currently Assigned
              </Badge>
              <div className="flex-1">
                <p className="font-medium">{currentAssignment.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {currentAssignment.email} • {currentAssignment.role}
                </p>
              </div>
            </div>
          )}

          {!currentAssignment && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Admin User</label>
              <Select
                value={selectedAdminUserId}
                onValueChange={setSelectedAdminUserId}
                disabled={fetchingAdmins}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    fetchingAdmins ? "Loading..." : "Choose an admin user"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {adminUsers.map((admin) => (
                    <SelectItem key={admin._id} value={admin._id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{admin.fullName}</span>
                        <span className="text-sm text-muted-foreground">
                          {admin.email} • {admin.role}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          
          {currentAssignment ? (
            <Button
              type="button"
              variant="destructive"
              onClick={handleUnassign}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <UserX className="h-4 w-4 mr-2" />
                  Remove Assignment
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleAssign}
              disabled={loading || !selectedAdminUserId}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Assign User
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 