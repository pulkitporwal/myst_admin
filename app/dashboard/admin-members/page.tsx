"use client";
import { useEffect, useState } from "react";
import { AdminUserType } from "./columns";
import { AdminUserTable } from "./data-table";
import { useApi } from "@/hooks/use-api";
import { TOAST_CONFIGS } from "@/lib/api-utils";

export default function Page() {
  const [adminUserData, setAdminUserData] = useState<AdminUserType[]>([]);
  
  const { get } = useApi();

  useEffect(() => {
    const fetchData = async () => {
      const result = await get("/api/admin-users", TOAST_CONFIGS.fetch);
      if (result.success && result.data) {
        setAdminUserData(result.data);
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
