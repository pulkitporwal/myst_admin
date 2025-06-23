import { AdminUserType } from "./columns";
import { UserTable } from "./data-table";

const data: AdminUserType[] = [
  {
    id: "1",
    fullName: "Pulkit Porwal",
    email: "pulkit@example.com",
    role: "super-admin",
  },
  {
    id: "2",
    fullName: "Aarav Sharma",
    email: "aarav.sharma@example.com",
    role: "admin",
  },
  {
    id: "3",
    fullName: "Neha Verma",
    email: "neha.verma@example.com",
    role: "manager",
  },
];

export default function Page() {
  return (
    <div className="p-4 w-full h-full">
      <h1 className="text-xl font-semibold mb-4">Users</h1>
      <UserTable data={data} />
    </div>
  );
}
