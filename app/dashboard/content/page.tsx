"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ContentType } from "./columns";
import { ContentTable } from "./data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import { TOAST_CONFIGS } from "@/lib/api-utils";

export default function Page() {
  const router = useRouter();
  const [contentData, setContentData] = useState<ContentType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const { get } = useApi();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await get("/api/content", TOAST_CONFIGS.fetch);
        if (result.success && result.data) {
          setContentData(result.data);
        }
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Content Management</h1>
          <p className="text-muted-foreground">
            Manage and create content for user profiles
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/content/create")}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Content
        </Button>
      </div>

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
