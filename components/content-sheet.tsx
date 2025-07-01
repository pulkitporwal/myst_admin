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
import { UserType } from "@/app/dashboard/users/columns";
import { Skeleton } from "./ui/skeleton";
import Image from "next/image";
import Link from "next/link";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card } from "./ui/card";
import { handleAPICall, methodENUM } from "@/lib/api-utils";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowUpLeftFromSquare,
  ArrowUpRightFromSquare,
  Link2Icon,
} from "lucide-react";
import CustomDialog from "@/components/reusable-dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useRouter } from "next/navigation";

export function ContentSheet({
  contentId,
  triggerLabel = "View",
  onDelete,
}: {
  contentId: string;
  triggerLabel: string;
  onDelete?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletePopoverOpen, setDeletePopoverOpen] = useState(false);
  const router = useRouter();

  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);
    setEditMode(false);
    if (isOpen) {
      setContent(undefined);
      setLoading(true);
      try {
        const data = await handleAPICall(
          `/api/content/${contentId}`,
          methodENUM.GET
        );
        if (data) {
          setContent(data);
        }
      } catch (e) {
        setContent(undefined);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = () => {
    setEditData({ ...content });
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditData(null);
  };

  const handleChange = (field: string, value: any) => {
    setEditData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatePayload = { ...editData };
      // Convert interestIn from string to array if needed
      if (typeof updatePayload.interestIn === "string") {
        updatePayload.interestIn = updatePayload.interestIn
          .split(",")
          .map((s: string) => ({ interest: s.trim() }))
          .filter((i: any) => i.interest);
      }
      const data = await handleAPICall(
        `/api/content/${contentId}`,
        methodENUM.PUT,
        updatePayload
      );
      if (data) {
        setContent(data);
        setEditMode(false);
        setEditData(null);
        toast.success("Content updated successfully");
      }
    } catch (error) {
      toast.error("Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const data = await handleAPICall(
        `/api/content/${contentId}`,
        methodENUM.DELETE
      );
      if (data) {
        toast.success("Content deleted successfully");
        setOpen(false);
        setDeletePopoverOpen(false);
        if (onDelete) onDelete();
      }
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete content");
    } finally {
      setDeleting(false);
    }
  };

  // Helper to render a row
  const renderRow = (label: string, field: string, type: string = "text") => (
    <TableRow>
      <TableCell className="font-medium pr-4 py-2 w-40">{label}</TableCell>
      <TableCell className="py-2">
        {editMode ? (
          type === "textarea" ? (
            <Textarea
              value={editData?.[field] ?? ""}
              onChange={(e) => handleChange(field, e.target.value)}
              rows={3}
            />
          ) : type === "switch" ? (
            <Switch
              checked={!!editData?.[field]}
              onCheckedChange={(val) => handleChange(field, val)}
            />
          ) : (
            <Input
              type={type}
              value={editData?.[field] ?? ""}
              onChange={(e) => handleChange(field, e.target.value)}
            />
          )
        ) : type === "switch" ? (
          <span>{content?.[field] ? "Yes" : "No"}</span>
        ) : (
          <span>
            {Array.isArray(content?.[field])
              ? content?.[field]
                  .map((item) =>
                    typeof item === "object"
                      ? JSON.stringify(item)
                      : String(item)
                  )
                  .join(", ")
              : typeof content?.[field] === "object"
              ? JSON.stringify(content?.[field])
              : String(content?.[field] ?? "-")}
          </span>
        )}
      </TableCell>
    </TableRow>
  );

  // Special row for interests
  const renderInterestsRow = () => (
    <TableRow>
      <TableCell className="font-medium pr-4 py-2 w-40">Interests</TableCell>
      <TableCell className="py-2">
        {editMode ? (
          <Input
            value={
              Array.isArray(editData?.interestIn)
                ? editData.interestIn.map((i: any) => i.interest).join(", ")
                : editData?.interestIn || ""
            }
            onChange={(e) => handleChange("interestIn", e.target.value)}
            placeholder="Comma separated interests"
          />
        ) : (
          <span>
            {Array.isArray(content?.interestIn)
              ? content.interestIn.map((i: any) => i.interest).join(", ")
              : "-"}
          </span>
        )}
      </TableCell>
    </TableRow>
  );

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          {triggerLabel}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {content
              ? `${content?.fullName?.toUpperCase()}'s INFORMATION`
              : "CONTENT INFORMATION"}
          </SheetTitle>
        </SheetHeader>
        <div className="w-full px-5 overflow-y-auto pb-5">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
            </div>
          ) : content ? (
            <div className="w-full h-ful gap-4 flex items-center flex-col justify-start">
              <div className="w-full flex flex-col items-center justify-center gap-5 ">
                {/* Avatar/Media Preview */}
                {content.content_url && content.content_url.length > 0 ? (
                  (() => {
                    const url = content.content_url[0];
                    const isVideo = /\.(mp4|webm|ogg)$/i.test(url);
                    const isImage = /\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i.test(
                      url
                    );
                    if (isVideo) {
                      return (
                        <video
                          className="rounded-md max-h-[500px] bg-black"
                          src={url}
                          controls
                          poster={content.thumbnail_url || undefined}
                        />
                      );
                    } else if (isImage) {
                      return (
                        <Image
                          className="rounded-full overflow-hidden"
                          src={url}
                          width={200}
                          height={200}
                          alt={content.fullName}
                        />
                      );
                    } else if (content.avatarURL) {
                      return (
                        <Image
                          className="rounded-full overflow-hidden"
                          src={content.avatarURL}
                          width={200}
                          height={200}
                          alt={content.fullName}
                        />
                      );
                    } else {
                      return (
                        <div className="w-[150px] h-[150px] flex items-center justify-center bg-gray-200 text-gray-500 rounded-full text-2xl">
                          N/A
                        </div>
                      );
                    }
                  })()
                ) : content.avatarURL ? (
                  <Image
                    className=" rounded-full overflow-hidden"
                    src={content.avatarURL}
                    width={200}
                    height={200}
                    alt={content.fullName}
                  />
                ) : (
                  <div className="w-[150px] h-[150px] flex items-center justify-center bg-gray-200 text-gray-500 rounded-full text-2xl">
                    N/A
                  </div>
                )}
              </div>
              <Card className="w-full mt-6 rounded-md bg-neutral-100 p-4">
                <Table>
                  <TableBody>
                    {/* Linked User */}
                    <TableRow>
                      <TableCell className="font-medium pr-4 py-2 w-40">
                        Posted By
                      </TableCell>
                      <TableCell className="py-2">
                        {content?.user_id?.fullName} (@
                        {content?.user_id?.userName})
                      </TableCell>
                    </TableRow>

                    {renderRow("Caption", "caption")}
                    {renderRow("Content Type", "content_type")}
                    {renderRow("Media Type", "media_type")}
                    {renderRow("Location", "location")}
                    {renderRow("Duration (seconds)", "duration", "number")}
                    {renderRow("Expires At", "expires_at")}
                    {/* Created At (display only) */}
                    <TableRow>
                      <TableCell className="font-medium pr-4 py-2 w-40">
                        Created At
                      </TableCell>
                      <TableCell className="py-2">
                        <span>
                          {content?.createdAt ? String(content.createdAt) : "-"}
                        </span>
                      </TableCell>
                    </TableRow>
                    {/* Updated At (display only) */}
                    <TableRow>
                      <TableCell className="font-medium pr-4 py-2 w-40">
                        Updated At
                      </TableCell>
                      <TableCell className="py-2">
                        <span>
                          {content?.updatedAt ? String(content.updatedAt) : "-"}
                        </span>
                      </TableCell>
                    </TableRow>
                    {/* Thumbnail */}
                    <TableRow>
                      <TableCell className="font-medium pr-4 py-2 w-40">
                        Thumbnail
                      </TableCell>
                      <TableCell className="py-2">
                        {content?.thumbnail_url ? (
                          <Image
                            src={content.thumbnail_url}
                            alt="Thumbnail"
                            width={200}
                            height={120}
                            className="rounded"
                          />
                        ) : (
                          "No thumbnail"
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <div className="flex gap-2 mt-4 justify-end">
                  {editMode ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                          <>
                            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Saving...
                          </>
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                     
                      <Button onClick={handleEdit}>Edit</Button>
                    </>
                  )}
                </div>
              </Card>
              <Card className="w-full px-5">
                <Popover open={deletePopoverOpen} onOpenChange={setDeletePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="destructive">Delete Content</Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80">
                    <div className="flex flex-col gap-3">
                      <div className="font-semibold text-lg">Are you sure?</div>
                      <div className="text-sm text-muted-foreground">
                        This action cannot be undone. This will permanently delete the content and all associated data.
                      </div>
                      <div className="flex gap-2 justify-end mt-2">
                        <Button
                          variant="outline"
                          onClick={() => setDeletePopoverOpen(false)}
                          disabled={deleting}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDelete}
                          disabled={deleting}
                        >
                          {deleting ? (
                            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent inline-block" />
                          ) : null}
                          Yes, Delete
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </Card>
            </div>
          ) : (
            <div>No user data found.</div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
