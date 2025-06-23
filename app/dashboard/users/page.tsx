"use client";

import { useEffect, useState } from "react";
import { UserType } from "./columns";
import { UserTable } from "./data-table";
import { Skeleton } from "@/components/ui/skeleton";

export default function Page() {
  const [userData, setUserData] = useState<UserType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/users");
        const { data } = await response.json();
        setUserData(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false); // hide loader
      }
    };
    fetchData();
  }, []);

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
