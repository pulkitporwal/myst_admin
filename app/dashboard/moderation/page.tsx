"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ContentReportType } from "./columns";
import { ContentTable } from "./data-table";
import { handleAPICall, methodENUM } from "@/lib/api-utils";

export default function Page() {
  const [moderationData, setModerationData] = useState<ContentReportType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await handleAPICall("/api/moderation", methodENUM.GET);
        if (data) {
          setModerationData(data);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-4 w-full h-full">
      <h1 className="text-xl font-semibold mb-4">Moderations</h1>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="grid grid-cols-7 gap-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <ContentTable data={moderationData} />
      )}
    </div>
  );
}
