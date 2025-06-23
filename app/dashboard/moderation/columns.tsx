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
  content_id: Types.ObjectId;
  user_id: Types.ObjectId;
  reason: string;
  status: REPORT_STATUS;
  created_at: Date;
};

export const columns: ColumnDef<ContentReportType>[] = [
  {
    accessorKey: "user_id",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>User</Button>
    ),
    cell: ({ row }) => {
      const user = row.original.user_id as any;
      return user && typeof user === "object" ? (
        <div className="flex items-center gap-2">
          {user.avatarURL ? (
            <img src={user.avatarURL} alt={user.fullName} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">N/A</div>
          )}
          <div>
            <div className="font-medium">{user.fullName}</div>
            <div className="text-sm text-gray-500">@{user.userName}</div>
          </div>
        </div>
      ) : (
        row.original.user_id?.toString() || "-"
      );
    },
  },
  {
    accessorKey: "content_id",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Content</Button>
    ),
    cell: ({ row }) => {
      const content = row.original.content_id as any;
      return content && typeof content === "object" ? (
        <a href={content.content_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a>
      ) : (
        row.original.content_id?.toString() || "-"
      );
    },
  },
  {
    accessorKey: "reason",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Reason</Button>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Status</Button>
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
    accessorKey: "created_at",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Created At</Button>
    ),
    
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ModerationSheet reportId={row.original._id || row.original.id} triggerLabel="View" />,
    enableSorting: false,
    enableHiding: false,
  },
];
