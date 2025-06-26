"use client";
import { useEffect, useState } from "react";
import { AdminUserType } from "./columns";
import { AdminUserTable } from "./data-table";

export default function Page() {
  const [adminUserData, setAdminUserData] = useState<AdminUserType[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch("/api/admin-users");
      const { data } = await response.json();

      setAdminUserData(data);
    };

    fetchData();
  }, []);

  console.log(adminUserData);

  return (
    <div className="p-4 w-full h-full">
      <h1 className="text-xl font-semibold mb-4">Admin Users</h1>
      <AdminUserTable data={adminUserData} />
    </div>
  );
}
