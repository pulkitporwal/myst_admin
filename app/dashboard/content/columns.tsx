"use client";

import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ArrowUpDown, Check, X } from "lucide-react";
import { Types } from "mongoose"; // Only if needed
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

export type CONTENT_TYPE = "image" | "video";

export type ContentType = {
  user_id: {
    _id: string;
    fullName: string;
    userName: string;
    avatarURL?: string;
  };
  _id: string;
  content_url: string;
  thumbnail_url?: string;
  caption?: string;
  category?: { _id: string; interest: string }[];
  content_type: CONTENT_TYPE;
  location?: string;
  tagUser: string;
  media_type: string;
  expires_at?: Date;
  duration?: number;
};

export const columns: ColumnDef<ContentType>[] = [
  {
    accessorKey: "user_id",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        User
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const user_id = row.original.user_id;

      const hasAvatar = user_id?.avatarURL && user_id.avatarURL.trim() !== "";

      return (
        <div className="flex items-center gap-2">
          {hasAvatar ? (
            <img
              src={user_id?.avatarURL}
              alt={user_id?.fullName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
              N/A
            </div>
          )}
          <div>
            <div className="font-medium">{user_id?.fullName}</div>
            <div className="text-sm text-gray-500">@{user_id?.userName}</div>
          </div>
        </div>
      );
    },
  },

  {
    accessorKey: "content_url",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Content URL
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Link
        href={row.original?.content_url[0]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline"
      >
        View
      </Link>
    ),
  },
  {
    accessorKey: "thumbnail_url",
    header: "Thumbnail",
    enableSorting: false,
    cell: ({ row }) =>
      row.original.thumbnail_url ? (
        <img
          src={row.original.thumbnail_url}
          alt="Thumbnail"
          className="h-10 w-10 object-cover rounded"
        />
      ) : (
        "N/A"
      ),
  },
  {
    accessorKey: "caption",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Caption
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    enableSorting: false,
    cell: ({ row }) =>
      row.original.category?.length ? (
        <div className="flex flex-wrap gap-1">
          {row.original.category.map((cat, i) => (
            <span
              key={i}
              className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs"
            >
              {cat.interest}
            </span>
          ))}
        </div>
      ) : (
        "—"
      ),
  },

  {
    accessorKey: "content_type",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Content Type
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "media_type",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Media Type
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "location",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Location
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "tagUser",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Tagged User
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "expires_at",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Expires At
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) =>
      row.original.expires_at
        ? format(new Date(row.original.expires_at), "yyyy-MM-dd HH:mm")
        : "—",
  },
  {
    accessorKey: "duration",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Duration (s)
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) =>
      row.original.duration ? `${row.original.duration} sec` : "—",
  },
  {
    id: "view",
    header: "View",
    cell: ({ row }) => {
      const id = row.original?._id;
      // Lazy import to avoid SSR issues
      const ContentSheet = require("@/components/content-sheet").ContentSheet;
      return <ContentSheet contentId={id} triggerLabel="View" />;
    },
    enableSorting: false,
  },
];
