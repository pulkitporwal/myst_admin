import { toast } from 'sonner';

// Common toast messages
export const TOAST_MESSAGES = {
  // Success messages
  FETCH_SUCCESS: 'Data fetched successfully',
  CREATE_SUCCESS: 'Created successfully',
  UPDATE_SUCCESS: 'Updated successfully',
  DELETE_SUCCESS: 'Deleted successfully',
  ASSIGN_SUCCESS: 'Assigned successfully',
  UNASSIGN_SUCCESS: 'Unassigned successfully',
  SAVE_SUCCESS: 'Saved successfully',
  LOGIN_SUCCESS: 'Logged in successfully',
  LOGOUT_SUCCESS: 'Logged out successfully',
  
  // Error messages
  FETCH_ERROR: 'Failed to fetch data',
  CREATE_ERROR: 'Failed to create',
  UPDATE_ERROR: 'Failed to update',
  DELETE_ERROR: 'Failed to delete',
  ASSIGN_ERROR: 'Failed to assign',
  UNASSIGN_ERROR: 'Failed to unassign',
  SAVE_ERROR: 'Failed to save',
  LOGIN_ERROR: 'Login failed',
  LOGOUT_ERROR: 'Logout failed',
  NETWORK_ERROR: 'Network error occurred',
  UNKNOWN_ERROR: 'An unexpected error occurred',
  
  // Validation messages
  REQUIRED_FIELDS: 'Please fill in all required fields',
  INVALID_DATA: 'Invalid data provided',
  PERMISSION_DENIED: 'Permission denied',
} as const;

// API response interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Toast configuration interface
export interface ToastConfig {
  showSuccess?: boolean;
  showError?: boolean;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

// Enhanced fetch function with automatic toast handling
export async function apiCall<T = any>(
  url: string,
  options: RequestInit = {},
  toastConfig: ToastConfig = {}
): Promise<ApiResponse<T>> {
  const {
    showSuccess = true,
    showError = true,
    successMessage,
    errorMessage,
    onSuccess,
    onError,
  } = toastConfig;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const result: ApiResponse<T> = await response.json();

    if (response.ok && result.success) {
      // Success case
      if (showSuccess) {
        const message = successMessage || result.message || TOAST_MESSAGES.FETCH_SUCCESS;
        toast.success(message);
      }
      
      if (onSuccess) {
        onSuccess(result.data);
      }
      
      return result;
    } else {
      // Error case
      const errorMsg = errorMessage || result.error || `HTTP ${response.status}: ${response.statusText}`;
      
      if (showError) {
        toast.error(errorMsg);
      }
      
      if (onError) {
        onError(errorMsg);
      }
      
      return {
        success: false,
        error: errorMsg,
      };
    }
  } catch (error) {
    // Network or parsing error
    const errorMsg = errorMessage || TOAST_MESSAGES.NETWORK_ERROR;
    
    if (showError) {
      toast.error(errorMsg);
    }
    
    if (onError) {
      onError(errorMsg);
    }
    
    return {
      success: false,
      error: errorMsg,
    };
  }
}

// Convenience functions for common HTTP methods
export const api = {
  get: <T = any>(url: string, toastConfig?: ToastConfig) => 
    apiCall<T>(url, { method: 'GET' }, toastConfig),
  
  post: <T = any>(url: string, data?: any, toastConfig?: ToastConfig) => 
    apiCall<T>(url, { 
      method: 'POST', 
      body: data ? JSON.stringify(data) : undefined 
    }, toastConfig),
  
  put: <T = any>(url: string, data?: any, toastConfig?: ToastConfig) => 
    apiCall<T>(url, { 
      method: 'PUT', 
      body: data ? JSON.stringify(data) : undefined 
    }, toastConfig),
  
  patch: <T = any>(url: string, data?: any, toastConfig?: ToastConfig) => 
    apiCall<T>(url, { 
      method: 'PATCH', 
      body: data ? JSON.stringify(data) : undefined 
    }, toastConfig),
  
  delete: <T = any>(url: string, toastConfig?: ToastConfig) => 
    apiCall<T>(url, { method: 'DELETE' }, toastConfig),
};

// Predefined toast configurations for common operations
export const TOAST_CONFIGS = {
  fetch: {
    showSuccess: false, // Usually don't show success for fetches
    showError: true,
    errorMessage: TOAST_MESSAGES.FETCH_ERROR,
  },
  create: {
    showSuccess: true,
    showError: true,
    successMessage: TOAST_MESSAGES.CREATE_SUCCESS,
    errorMessage: TOAST_MESSAGES.CREATE_ERROR,
  },
  update: {
    showSuccess: true,
    showError: true,
    successMessage: TOAST_MESSAGES.UPDATE_SUCCESS,
    errorMessage: TOAST_MESSAGES.UPDATE_ERROR,
  },
  delete: {
    showSuccess: true,
    showError: true,
    successMessage: TOAST_MESSAGES.DELETE_SUCCESS,
    errorMessage: TOAST_MESSAGES.DELETE_ERROR,
  },
  assign: {
    showSuccess: true,
    showError: true,
    successMessage: TOAST_MESSAGES.ASSIGN_SUCCESS,
    errorMessage: TOAST_MESSAGES.ASSIGN_ERROR,
  },
  unassign: {
    showSuccess: true,
    showError: true,
    successMessage: TOAST_MESSAGES.UNASSIGN_SUCCESS,
    errorMessage: TOAST_MESSAGES.UNASSIGN_ERROR,
  },
  silent: {
    showSuccess: false,
    showError: false,
  },
} as const; 