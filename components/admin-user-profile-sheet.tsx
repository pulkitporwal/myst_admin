"use client";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "./ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { BriefcaseBusiness, Mail, User, Shield, X, Save } from "lucide-react";
import { BulkUserAssignment } from "./bulk-user-assignment";
import { AssignedProfilesList } from "./assigned-profiles-list";
import ComboBox from "./combo-box";
import { useApi } from "@/hooks/use-api";
import { TOAST_CONFIGS } from "@/lib/api-utils";

interface AdminUserData {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  phoneNumber?: string;
  profileImage?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  permissions?: Array<{
    _id: string;
    name: string;
    description: string;
  }>;
}

interface PermissionData {
  _id: string;
  name: string;
  description: string;
}

export function AdminUserProfileSheet({
  userId,
  triggerLabel = "View",
}: {
  userId: string;
  triggerLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<AdminUserData>();
  const [fetchedPermissions, setFetchedPermissions] = useState<PermissionData[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<{ value: string; label: string }[]>([]);
  
  const { loading, get, put } = useApi();

  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setUser(undefined);
      try {
        const result = await get(`/api/admin-users/${userId}`, TOAST_CONFIGS.fetch);
        if (result.success && result.data) {
          setUser(result.data);
          
          // Set existing permissions
          if (result.data.permissions) {
            setSelectedPermissions(result.data.permissions.map((p: any) => p.name));
          } else {
            setSelectedPermissions([]);
          }
          
          // Fetch permissions and update available ones
          await fetchPermissions();
        }
      } catch (e) {
        console.error("Error fetching admin user:", e);
        setUser(undefined);
      }
    }
  };

  useEffect(() => {
    if (open) {
      fetchPermissions();
    }
  }, [open]);

  const fetchPermissions = async () => {
    try {
      const result = await get("/api/permissions", TOAST_CONFIGS.fetch);
      if (result.success && result.data) {
        setFetchedPermissions(result.data);
        
        // Create available permissions for combo box (excluding already selected ones)
        const available = result.data
          .filter((permission: PermissionData) => !selectedPermissions.includes(permission.name))
          .map((permission: PermissionData) => ({
            value: permission.name,
            label: permission.name,
          }));
        setAvailablePermissions(available);
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };

  const handleAssignmentComplete = async () => {
    // Refresh the admin user data to show updated assignment info
    if (open && user) {
      try {
        const result = await get(`/api/admin-users/${userId}`, TOAST_CONFIGS.silent);
        if (result.success && result.data) {
          setUser(result.data);
        }
      } catch (error) {
        console.error("Error refreshing user data:", error);
      }
    }
  };

  const handleAddPermission = (permissionName: string) => {
    if (!selectedPermissions.includes(permissionName)) {
      setSelectedPermissions([...selectedPermissions, permissionName]);
      // Update available permissions
      setAvailablePermissions(availablePermissions.filter(p => p.value !== permissionName));
    }
  };

  const handleRemovePermission = (permissionName: string) => {
    setSelectedPermissions(selectedPermissions.filter(p => p !== permissionName));
    // Add back to available permissions
    const permission = fetchedPermissions.find(p => p.name === permissionName);
    if (permission) {
      setAvailablePermissions([...availablePermissions, { value: permission.name, label: permission.name }]);
    }
  };

  const handleSavePermissions = async () => {
    if (!user) return;
    
    try {
      // Get permission IDs for selected permission names
      const permissionIds = fetchedPermissions
        .filter(permission => selectedPermissions.includes(permission.name))
        .map(permission => permission._id);

      const result = await put(`/api/admin-users/${user._id}`, {
        permissions: permissionIds,
      }, {
        ...TOAST_CONFIGS.update,
        successMessage: "Permissions updated successfully",
        onSuccess: async () => {
          // Refresh user data to show updated permissions
          const refreshResult = await get(`/api/admin-users/${userId}`, TOAST_CONFIGS.silent);
          if (refreshResult.success && refreshResult.data) {
            setUser(refreshResult.data);
            
            // Update selected permissions
            if (refreshResult.data.permissions) {
              setSelectedPermissions(refreshResult.data.permissions.map((p: any) => p.name));
            } else {
              setSelectedPermissions([]);
            }
            
            // Refresh available permissions
            await fetchPermissions();
          }
        },
      });
    } catch (error) {
      console.error('Error updating permissions:', error);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super-admin":
        return <Badge variant="destructive">Super Admin</Badge>;
      case "admin":
        return <Badge variant="default">Admin</Badge>;
      case "manager":
        return <Badge variant="secondary">Manager</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          {triggerLabel}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[90%] sm:w-[600px] max-w-full overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <BriefcaseBusiness className="h-5 w-5" />
            Admin User Details
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : user ? (
          <div className="space-y-6 px-2 sm:px-5 pb-5">
            {/* Admin User Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    {user.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={user.fullName}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold break-words">{user.fullName}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {getRoleBadge(user.role)}
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span>Email</span>
                    </div>
                    <p className="font-medium break-words">{user.email}</p>
                  </div>

                  {user.phoneNumber && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Shield className="h-4 w-4 flex-shrink-0" />
                        <span>Phone</span>
                      </div>
                      <p className="font-medium break-words">{user.phoneNumber}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Created</div>
                    <p className="font-medium">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {user.lastLogin && (
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Last Login
                      </div>
                      <p className="font-medium">
                        {new Date(user.lastLogin).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Permissions Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Permissions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Existing Permissions */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Current Permissions</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedPermissions.length > 0 ? (
                      selectedPermissions.map((permissionName) => {
                        const permission = fetchedPermissions.find(p => p.name === permissionName);
                        return (
                          <Badge key={permissionName} variant="secondary" className="flex items-center gap-1 bg-neutral-200 max-w-full">
                            <span className="truncate">{permissionName}</span>
                            <button
                              onClick={() => handleRemovePermission(permissionName)}
                              className="ml-1 hover:bg-neutral-500 hover:text-destructive-foreground rounded-full p-0.5 flex-shrink-0"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">No permissions assigned</p>
                    )}
                  </div>
                </div>

                {/* Add New Permissions */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Add Permissions</div>
                  <ComboBox
                    data={availablePermissions}
                    comboBoxValue={[]}
                    setComboBoxValue={(values) => {
                      if (values.length > 0) {
                        handleAddPermission(values[0]);
                      }
                    }}
                  />
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-2">
                  <Button 
                    onClick={handleSavePermissions} 
                    className="flex items-center gap-2 w-full sm:w-auto"
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>

            {["admin", "manager"].includes(user.role) && (
              <>
                <AssignedProfilesList
                  adminUserId={user._id}
                  adminUserName={user.fullName}
                  onAssignmentChange={handleAssignmentComplete}
                />
                <BulkUserAssignment
                  adminUserId={user._id}
                  adminUserName={user.fullName}
                  onAssignmentComplete={handleAssignmentComplete}
                />
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Failed to load admin user details
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
