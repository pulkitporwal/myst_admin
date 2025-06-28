"use client";

import { Button } from "@/components/ui/button";
import { UserProfileSheet } from "@/components/user-profile-sheet";
import { UserAssignmentDialog } from "@/components/user-assignment-dialog";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ArrowUpDown, Check, X, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type UserType = {
  _id: string;
  fullName: string;
  userName: string;
  gender: string;
  dob: string;
  avatarURL: string;
  mobileNumber: number;
  email: string;
  bio: string;
  isActive: boolean;
  isVerified: boolean;
  interestIn: Array<{ interest: string; description?: string }>;
  posts: number;
  followers: number;
  following: number;
  rockets: number;
  wallet: number;
  socialLinks: string[];
  assignedTo?: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  } | null;
  createdAt: string;
};

// Create a function that returns columns based on showAssignButton prop
export const createColumns = (showAssignButton: boolean = true): ColumnDef<UserType>[] => [
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
    accessorKey: "userName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        userName
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "avatarURL",
    header: "Avatar",
    enableSorting: false,
    cell: ({ row }) => {
      const url = row.original.avatarURL;

      const isValidURL = url && url.trim().length > 0;

      return isValidURL ? (
        <img
          src={url}
          alt={row.original.fullName}
          className="h-10 w-10 rounded-full object-cover"
        />
      ) : (
        <div className="h-10 w-10 flex items-center justify-center bg-gray-200 text-xs text-gray-500 rounded-full">
          N/A
        </div>
      );
    },
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
    accessorKey: "assignedTo",
    header: "Assigned To",
    cell: ({ row }) => {
      const assignment = row.original.assignedTo;
      
      if (!assignment) {
        return (
          <Badge variant="outline" className="text-xs">
            Unassigned
          </Badge>
        );
      }

      return (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{assignment.fullName}</span>
          <span className="text-xs text-muted-foreground">
            {assignment.role} • {assignment.email}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "interestIn",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Interests
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.interestIn?.map((item: any) => (
          <span
            key={item._id}
            className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs"
          >
            {item.interest}
          </span>
        ))}
      </div>
    ),
  },
  {
    accessorKey: "wallet",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Wallet Balance
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) =>
      row.original.wallet.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      }),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <UserProfileSheet userId={row.original._id} triggerLabel="View" />
        {showAssignButton && (
          <UserAssignmentDialog
            userId={row.original._id}
            userName={row.original.userName}
            currentAssignment={row.original.assignedTo}
            onAssignmentChange={() => {
              // Trigger a table refresh by updating the data
              // This will be handled by the parent component's data fetching
              window.dispatchEvent(new CustomEvent('refreshUsersTable'));
            }}
          />
        )}
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];

// Default columns export for backward compatibility
export const columns = createColumns(true);
