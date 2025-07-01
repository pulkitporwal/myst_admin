"use client";

import { useEffect, useState } from "react";
import { UserType } from "./columns";
import { UserTable } from "./data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { handleAPICall, methodENUM } from "@/lib/api-utils";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateUserDialog } from "@/components/create-user-dialog";

export default function Page() {
  const [userData, setUserData] = useState<UserType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await handleAPICall("/api/users", methodENUM.GET);
      if (data) {
        setUserData(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false); // hide loader
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Listen for refresh events from user assignment changes
    const handleRefresh = () => {
      fetchData();
    };

    window.addEventListener('refreshUsersTable', handleRefresh);
    
    return () => {
      window.removeEventListener('refreshUsersTable', handleRefresh);
    };
  }, []);

  console.log(userData)

  return (
    <div className="p-4 w-full h-full">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Users</h1>
        <CreateUserDialog onUserCreated={fetchData} />
      </div>

      {loading ? (
        <div className="space-y-4">
          {/* Repeat 5 rows for skeleton table */}
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="grid grid-cols-7 gap-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <UserTable data={userData} />
      )}
    </div>
  );
}
