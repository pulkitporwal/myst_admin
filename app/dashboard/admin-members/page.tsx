"use client";
import { useEffect, useState } from "react";
import { AdminUserType } from "./columns";
import { AdminUserTable } from "./data-table";
import { handleAPICall, methodENUM } from "@/lib/api-utils";

export default function Page() {
  const [adminUserData, setAdminUserData] = useState<AdminUserType[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await handleAPICall("/api/admin-users", methodENUM.GET);
        if (data) {
          setAdminUserData(data);
        }
      } catch (error) {
        console.error("Error fetching admin users:", error);
      }
    };

    fetchData();
  }, []);


  return (
    <div className="p-4 w-full h-full">
      <h1 className="text-xl font-semibold mb-4">Admin Users</h1>
      <AdminUserTable data={adminUserData} />
    </div>
  );
}
