"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useApi, useApiOperation } from '@/hooks/use-api';
import { api, TOAST_CONFIGS } from '@/lib/api-utils';

export function ApiExample() {
  const [data, setData] = useState<any>(null);
  const { loading, get, post, put, del } = useApi();
  const { loading: opLoading, fetchData, createData, updateData, deleteData } = useApiOperation();

  // Example using the useApi hook
  const handleFetchUsers = async () => {
    const result = await get('/api/users', TOAST_CONFIGS.fetch);
    if (result.success) {
      setData(result.data);
    }
  };

  const handleCreateUser = async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
    };
    
    const result = await post('/api/users', userData, {
      ...TOAST_CONFIGS.create,
      successMessage: 'User created successfully!',
    });
    
    if (result.success) {
      setData(result.data);
    }
  };

  const handleUpdateUser = async () => {
    const userData = {
      name: 'Updated User',
      email: 'updated@example.com',
    };
    
    const result = await put('/api/users/123', userData, {
      ...TOAST_CONFIGS.update,
      successMessage: 'User updated successfully!',
    });
    
    if (result.success) {
      setData(result.data);
    }
  };

  const handleDeleteUser = async () => {
    const result = await del('/api/users/123', {
      ...TOAST_CONFIGS.delete,
      successMessage: 'User deleted successfully!',
    });
    
    if (result.success) {
      setData(null);
    }
  };

  // Example using the useApiOperation hook
  const handleFetchWithOperation = async () => {
    const result = await fetchData('/api/users');
    if (result.success) {
      setData(result.data);
    }
  };

  const handleCreateWithOperation = async () => {
    const userData = {
      name: 'Operation User',
      email: 'operation@example.com',
    };
    
    const result = await createData('/api/users', userData, 'User created via operation!');
    if (result.success) {
      setData(result.data);
    }
  };

  // Example using direct API calls
  const handleDirectApiCall = async () => {
    const result = await api.get('/api/users', {
      ...TOAST_CONFIGS.fetch,
      onSuccess: (data) => {
        console.log('Success callback:', data);
        setData(data);
      },
      onError: (error) => {
        console.error('Error callback:', error);
      },
    });
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">API Examples with Toast Notifications</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="font-semibold">useApi Hook Examples:</h3>
          <Button 
            onClick={handleFetchUsers} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Loading...' : 'Fetch Users'}
          </Button>
          
          <Button 
            onClick={handleCreateUser} 
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? 'Creating...' : 'Create User'}
          </Button>
          
          <Button 
            onClick={handleUpdateUser} 
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? 'Updating...' : 'Update User'}
          </Button>
          
          <Button 
            onClick={handleDeleteUser} 
            disabled={loading}
            variant="destructive"
            className="w-full"
          >
            {loading ? 'Deleting...' : 'Delete User'}
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">useApiOperation Hook Examples:</h3>
          <Button 
            onClick={handleFetchWithOperation} 
            disabled={opLoading}
            className="w-full"
          >
            {opLoading ? 'Loading...' : 'Fetch (Operation)'}
          </Button>
          
          <Button 
            onClick={handleCreateWithOperation} 
            disabled={opLoading}
            variant="outline"
            className="w-full"
          >
            {opLoading ? 'Creating...' : 'Create (Operation)'}
          </Button>
          
          <Button 
            onClick={handleDirectApiCall} 
            className="w-full"
          >
            Direct API Call
          </Button>
        </div>
      </div>

      {data && (
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Response Data:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 