"use client";

import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ArrowUpDown, Check, X } from "lucide-react";
import React from "react";

export type ROLE = "super-admin" | "admin" | "manager";

export type AdminUserType = {
  id: string;
  fullName: string;
  email: string;
  role: ROLE;
};

export const columns = (
  currentUserRole: ROLE,
  onRoleChange: (id: string, newRole: ROLE) => void
): ColumnDef<AdminUserType>[] => [
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
    cell: ({ row }) =>
      currentUserRole === "super-admin" ? (
        <select
          className="border rounded px-2 py-1 text-sm"
          value={row.original.role}
          onChange={(e) =>
            onRoleChange(row.original.id, e.target.value as ROLE)
          }
        >
          <option value="super-admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
        </select>
      ) : (
        <span>{row.original.role}</span>
      ),
  },
];
