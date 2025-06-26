"use client";

import { AdminUserProfileSheet } from "@/components/admin-user-profile-sheet";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ArrowUpDown, Check, X } from "lucide-react";
import React from "react";

export type ROLE = "super-admin" | "admin" | "manager";

export type AdminUserType = {
  _id: string;
  fullName: string;
  email: string;
  role: ROLE;
};



export const columns: ColumnDef<AdminUserType>[] = [
  {
    accessorKey: "fullName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Full Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  
  {
    accessorKey: "email",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Email
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Role
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({row}) => (
      <div>{row.original.role == "super-admin" ? <div>SUPER ADMIN</div> : row.original.role == "admin" ? <div>ADMIN</div> : row.original.role == "manager" ? <div>MANAGER</div> : <div>ROLE DOESN'T EXIST</div>}</div>
    )
  },
 
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <AdminUserProfileSheet userId={row.original._id} triggerLabel="View" />
    ),
    enableSorting: false,
    enableHiding: false,
  },
];