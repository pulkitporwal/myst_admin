import { getCurrentUserWithPermissions } from "./getCurrentUserWithPermissions";

export async function checkPermission(requiredPermission: string): Promise<{
  hasPermission: boolean;
  user: any;
  permissions: string[];
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUserWithPermissions();
    
    if (!currentUser) {
      return {
        hasPermission: false,
        user: null,
        permissions: [],
        error: "User not authenticated"
      };
    }

    console.log(currentUser)

    const userPermissions = currentUser.permissions.map((p: any) => p.name);    
    
    // Check if user has the required permission
    const hasPermission = userPermissions.includes(requiredPermission);
    
    return {
      hasPermission,
      user: currentUser,
      permissions: userPermissions,
      error: hasPermission ? undefined : `Insufficient permissions. Required: ${requiredPermission}`
    };
  } catch (error) {
    console.error("Error checking permissions:", error);
    return {
      hasPermission: false,
      user: null,
      permissions: [],
      error: "Failed to check permissions"
    };
  }
}

// Check multiple permissions with OR logic (user needs ANY of the permissions)
export async function checkAnyPermission(requiredPermissions: string[]): Promise<{
  hasPermission: boolean;
  user: any;
  permissions: string[];
  matchedPermission?: string;
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUserWithPermissions();
    
    if (!currentUser) {
      return {
        hasPermission: false,
        user: null,
        permissions: [],
        error: "User not authenticated"
      };
    }

    const userPermissions = currentUser.permissions.map((p: any) => p.name);
    
    // Check if user has ANY of the required permissions
    const matchedPermission = requiredPermissions.find(permission => 
      userPermissions.includes(permission)
    );
    
    const hasPermission = !!matchedPermission;
    
    return {
      hasPermission,
      user: currentUser,
      permissions: userPermissions,
      matchedPermission,
      error: hasPermission ? undefined : `Insufficient permissions. Required any of: ${requiredPermissions.join(', ')}`
    };
  } catch (error) {
    console.error("Error checking permissions:", error);
    return {
      hasPermission: false,
      user: null,
      permissions: [],
      error: "Failed to check permissions"
    };
  }
}

// Check multiple permissions with AND logic (user needs ALL of the permissions)
export async function checkAllPermissions(requiredPermissions: string[]): Promise<{
  hasPermission: boolean;
  user: any;
  permissions: string[];
  missingPermissions: string[];
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUserWithPermissions();
    
    if (!currentUser) {
      return {
        hasPermission: false,
        user: null,
        permissions: [],
        missingPermissions: requiredPermissions,
        error: "User not authenticated"
      };
    }

    const userPermissions = currentUser.permissions.map((p: any) => p.name);
    
    // Check which required permissions are missing
    const missingPermissions = requiredPermissions.filter(permission => 
      !userPermissions.includes(permission)
    );
    
    const hasPermission = missingPermissions.length === 0;
    
    return {
      hasPermission,
      user: currentUser.user,
      permissions: userPermissions,
      missingPermissions,
      error: hasPermission ? undefined : `Insufficient permissions. Missing: ${missingPermissions.join(', ')}`
    };
  } catch (error) {
    console.error("Error checking permissions:", error);
    return {
      hasPermission: false,
      user: null,
      permissions: [],
      missingPermissions: requiredPermissions,
      error: "Failed to check permissions"
    };
  }
}

// Helper function to create permission error response for single permission
export function createPermissionErrorResponse(requiredPermission: string, userPermissions: string[]) {
  return {
    success: false,
    error: "Insufficient permissions",
    details: {
      required: requiredPermission,
      userPermissions: userPermissions,
      message: `You need the '${requiredPermission}' permission to perform this action.`
    }
  };
}

// Helper function to create permission error response for multiple permissions (OR)
export function createAnyPermissionErrorResponse(requiredPermissions: string[], userPermissions: string[]) {
  return {
    success: false,
    error: "Insufficient permissions",
    details: {
      required: requiredPermissions,
      userPermissions: userPermissions,
      message: `You need any of these permissions: ${requiredPermissions.join(', ')}`
    }
  };
}

// Helper function to create permission error response for multiple permissions (AND)
export function createAllPermissionsErrorResponse(requiredPermissions: string[], missingPermissions: string[], userPermissions: string[]) {
  return {
    success: false,
    error: "Insufficient permissions",
    details: {
      required: requiredPermissions,
      missing: missingPermissions,
      userPermissions: userPermissions,
      message: `You need all of these permissions: ${requiredPermissions.join(', ')}. Missing: ${missingPermissions.join(', ')}`
    }
  };
} 