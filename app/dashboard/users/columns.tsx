"use client";

import { Button } from "@/components/ui/button";
import { UserProfileSheet } from "@/components/user-profile-sheet";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ArrowUpDown, Check, X } from "lucide-react";

export type UserType = {
  _id: string;
  fullName: string;
  userName: string;
  gender: string;
  dob: Date;
  avatarURL: string;
  mobileNumber: string;
  email: string;
  bio: string;
  is_active: boolean;
  is_verified: boolean;
  interestIn: string[];
  wallet: number;
};

export const columns: ColumnDef<UserType>[] = [
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
      <UserProfileSheet userId={row.original._id} triggerLabel="View" />
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
