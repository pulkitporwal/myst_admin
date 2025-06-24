"use client";

import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ArrowUpDown } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Types } from "mongoose";
import { ModerationSheet } from "@/components/moderation-sheet";

export enum REPORT_STATUS {
  Pending = "pending",
  Resolved = "resolved",
  InProgress = "inprogress",
}

export type ContentReportType = {
  _id: string;
  reason: string;
  status: REPORT_STATUS;
  createdAt: string;

  user: {
    _id: string;
    fullName: string;
    userName: string;
    avatarURL: string;
  };

  content: {
    _id: string;
    content_url: string;
    thumbnail_url: string;
    caption: string;
    category: string[];
  };
};


export const columns: ColumnDef<ContentReportType>[] = [
  {
    accessorKey: "user",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        User
      </Button>
    ),
    cell: ({ row }) => {
      const user = row.original.user;
      return (
        <div className="flex items-center gap-2">
          {user.avatarURL ? (
            <img
              src={user.avatarURL}
              alt={user.fullName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">N/A</div>
          )}
          <div>
            <div className="font-medium">{user.fullName}</div>
            <div className="text-sm text-gray-500">@{user.userName}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "content",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Content
      </Button>
    ),
    cell: ({ row }) => {
      const content = row.original.content;
      return (
        <a
          href={content.content_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          View
        </a>
      );
    },
  },
  {
    accessorKey: "reason",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Reason
      </Button>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Status
      </Button>
    ),
    cell: ({ row }) => (
      <span
        className={`${
          row.original.status === REPORT_STATUS.Resolved
            ? "text-green-600"
            : row.original.status === REPORT_STATUS.InProgress
            ? "text-yellow-600"
            : "text-red-600"
        } font-medium`}
      >
        {row.original.status}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Created At
      </Button>
    ),
    cell: ({ row }) => format(new Date(row.original.createdAt), "dd MMM yyyy, p"),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <ModerationSheet reportId={row.original._id} triggerLabel="View" />
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
