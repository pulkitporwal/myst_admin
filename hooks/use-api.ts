import { useState } from 'react';
import { api, TOAST_CONFIGS, ToastConfig, ApiResponse } from '@/lib/api-utils';

interface UseApiOptions extends ToastConfig {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useApi() {
  const [loading, setLoading] = useState(false);

  const callApi = async <T = any>(
    url: string,
    options: RequestInit = {},
    toastOptions: UseApiOptions = {}
  ): Promise<ApiResponse<T>> => {
    setLoading(true);
    try {
      const result = await api.apiCall<T>(url, options, toastOptions);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const get = async <T = any>(
    url: string,
    toastOptions?: UseApiOptions
  ): Promise<ApiResponse<T>> => {
    setLoading(true);
    try {
      return await api.get<T>(url, toastOptions);
    } finally {
      setLoading(false);
    }
  };

  const post = async <T = any>(
    url: string,
    data?: any,
    toastOptions?: UseApiOptions
  ): Promise<ApiResponse<T>> => {
    setLoading(true);
    try {
      return await api.post<T>(url, data, toastOptions);
    } finally {
      setLoading(false);
    }
  };

  const put = async <T = any>(
    url: string,
    data?: any,
    toastOptions?: UseApiOptions
  ): Promise<ApiResponse<T>> => {
    setLoading(true);
    try {
      return await api.put<T>(url, data, toastOptions);
    } finally {
      setLoading(false);
    }
  };

  const patch = async <T = any>(
    url: string,
    data?: any,
    toastOptions?: UseApiOptions
  ): Promise<ApiResponse<T>> => {
    setLoading(true);
    try {
      return await api.patch<T>(url, data, toastOptions);
    } finally {
      setLoading(false);
    }
  };

  const del = async <T = any>(
    url: string,
    toastOptions?: UseApiOptions
  ): Promise<ApiResponse<T>> => {
    setLoading(true);
    try {
      return await api.delete<T>(url, toastOptions);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    get,
    post,
    put,
    patch,
    del,
    callApi,
  };
}

// Convenience hook for specific API operations
export function useApiOperation() {
  const [loading, setLoading] = useState(false);

  const fetchData = async <T = any>(url: string) => {
    setLoading(true);
    try {
      return await api.get<T>(url, TOAST_CONFIGS.fetch);
    } finally {
      setLoading(false);
    }
  };

  const createData = async <T = any>(url: string, data: any, customMessage?: string) => {
    setLoading(true);
    try {
      return await api.post<T>(url, data, {
        ...TOAST_CONFIGS.create,
        successMessage: customMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateData = async <T = any>(url: string, data: any, customMessage?: string) => {
    setLoading(true);
    try {
      return await api.put<T>(url, data, {
        ...TOAST_CONFIGS.update,
        successMessage: customMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteData = async <T = any>(url: string, customMessage?: string) => {
    setLoading(true);
    try {
      return await api.delete<T>(url, {
        ...TOAST_CONFIGS.delete,
        successMessage: customMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const assignUser = async <T = any>(url: string, data: any, customMessage?: string) => {
    setLoading(true);
    try {
      return await api.post<T>(url, data, {
        ...TOAST_CONFIGS.assign,
        successMessage: customMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const unassignUser = async <T = any>(url: string, customMessage?: string) => {
    setLoading(true);
    try {
      return await api.delete<T>(url, {
        ...TOAST_CONFIGS.unassign,
        successMessage: customMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    fetchData,
    createData,
    updateData,
    deleteData,
    assignUser,
    unassignUser,
  };
} 