"use client";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { handleAPICall, methodENUM } from "@/lib/api-utils";

export function ModerationSheet({ reportId, triggerLabel = "View" }) {
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchReport = async (id) => {
    setReport(null);
    setLoading(true);
    try {
      const data = await handleAPICall(`/api/moderation/${id}`, methodENUM.GET);
      if (data) {
        setReport(data);
        setStatus(data.status);
      }
    } catch (e) {
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (isOpen) fetchReport(reportId);
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const data = await handleAPICall(`/api/moderation/${reportId}`, methodENUM.PUT, { status: newStatus });
      if (data) {
        setReport(data);
        setStatus(data.status);
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">{triggerLabel}</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Moderation Report</SheetTitle>
        </SheetHeader>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <span>Loading...</span>
          </div>
        ) : report ? (
          <div className="space-y-4">
            <div>
              <div className="font-semibold mb-1">Reported By:</div>
              <div className="flex items-center gap-2">
                {report.user_id?.avatarURL ? (
                  <img src={report.user_id.avatarURL} alt={report.user_id.fullName} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">N/A</div>
                )}
                <div>
                  <div className="font-medium">{report.user_id?.fullName}</div>
                  <div className="text-sm text-gray-500">@{report.user_id?.userName}</div>
                </div>
              </div>
            </div>
            <div>
              <div className="font-semibold mb-1">Content:</div>
              <div className="break-all">
                {report.content_id?.content_url ? (
                  <a href={report.content_id.content_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Content</a>
                ) : (
                  <span>No content URL</span>
                )}
                <div className="text-xs text-gray-500 mt-1">{report.content_id?.caption}</div>
              </div>
            </div>
            <div>
              <div className="font-semibold mb-1">Reason:</div>
              <div>{report.reason}</div>
            </div>
            <div>
              <div className="font-semibold mb-1">Status:</div>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={loading}
                className="border rounded px-2 py-1"
              >
                <option value="pending">Pending</option>
                <option value="inprogress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
        ) : (
          <div>No report data found.</div>
        )}
        <SheetClose asChild>
          <Button className="mt-4" variant="secondary">Close</Button>
        </SheetClose>
      </SheetContent>
    </Sheet>
  );
} 