"use client";

import { useEffect, useState } from "react";
import { UserType } from "./columns";
import { UserTable } from "./data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import { TOAST_CONFIGS } from "@/lib/api-utils";

export default function Page() {
  const [userData, setUserData] = useState<UserType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const { get } = useApi();

  const fetchData = async () => {
    try {
      const result = await get("/api/users", TOAST_CONFIGS.fetch);
      if (result.success && result.data) {
        setUserData(result.data);
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
      <h1 className="text-xl font-semibold mb-4">Users</h1>

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
