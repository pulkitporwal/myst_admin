"use client";

import { useEffect, useState } from "react";
import { ContentType } from "./columns";
import { ContentTable } from "./data-table";
import { Skeleton } from "@/components/ui/skeleton";

export default function Page() {
  const [contentData, setContentData] = useState<ContentType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/content");
        const { data } = await response.json();
        setContentData(data);
      } catch (error) {
        console.error("Error fetching content:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-4 w-full h-full">
      <h1 className="text-xl font-semibold mb-4">Content</h1>

      {loading ? (
        <div className="space-y-4">
          {/* Skeleton header row */}
          <div className="grid grid-cols-8 gap-4 mb-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>

          {/* Skeleton data rows */}
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="grid grid-cols-8 gap-4">
              {Array.from({ length: 8 }).map((_, colIdx) => (
                <Skeleton key={colIdx} className="h-6 w-full" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <ContentTable data={contentData} />
      )}
    </div>
  );
}
