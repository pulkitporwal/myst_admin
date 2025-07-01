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

export function UserProfileSheet({
  userId,
  triggerLabel = "View",
}: {
  userId: string;
  triggerLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<UserType>();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);
    setEditMode(false);
    if (isOpen) {
      setUser(undefined);
      setLoading(true);
      try {
        const data = await handleAPICall(
          `/api/users/${userId}`,
          methodENUM.GET
        );
        if (data) {
          setUser(data);
        }
      } catch (e) {
        setUser(undefined);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = () => {
    setEditData({ ...user });
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
        `/api/users/${userId}`,
        methodENUM.PUT,
        updatePayload
      );
      if (data) {
        setUser(data);
        setEditMode(false);
        setEditData(null);
        toast.success("User updated successfully");
      }
    } catch (error) {
      toast.error("Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const data = await handleAPICall(
        `/api/users/${userId}`,
        methodENUM.DELETE
      );
      if (data) {
        toast.success("User deleted successfully");
        setOpen(false); // Close the sheet
      }
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  // Helper to render a row
  const renderRow = (
    label: string,
    field: keyof UserType,
    type: string = "text"
  ) => (
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
          <span>{user?.[field] ? "Yes" : "No"}</span>
        ) : (
          <span>
            {Array.isArray(user?.[field])
              ? (user?.[field] as any[])
                  .map((item) =>
                    typeof item === "object"
                      ? item.interest ?? JSON.stringify(item)
                      : String(item)
                  )
                  .join(", ")
              : typeof user?.[field] === "object"
              ? JSON.stringify(user?.[field])
              : String(user?.[field] ?? "-")}
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
            {Array.isArray(user?.interestIn)
              ? user.interestIn.map((i: any) => i.interest).join(", ")
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
            {user
              ? `${user?.fullName.toUpperCase()}'s INFORMATION`
              : "USER INFORMATION"}
          </SheetTitle>
        </SheetHeader>
        <div className="w-full px-5 overflow-y-auto pb-5">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
            </div>
          ) : user ? (
            <div className="w-full h-ful gap-4 flex items-center flex-col justify-start">
              <div className="w-full flex flex-col items-center justify-center gap-5 ">
                {user.avatarURL ? (
                  <Image
                    className=" rounded-full overflow-hidden"
                    src={user.avatarURL}
                    width={200}
                    height={200}
                    alt={user.fullName}
                  />
                ) : (
                  <div className="w-[150px] h-[150px] flex items-center justify-center bg-gray-200 text-gray-500 rounded-full text-2xl">
                    N/A
                  </div>
                )}
                <Link href={"/"} className="text-lg font-semibold">
                  @{user.userName}
                </Link>
              </div>
              <Card className="w-full mt-6 rounded-md bg-neutral-100 p-4">
                <Table>
                  <TableBody>
                    {renderRow("Full Name", "fullName")}
                    {renderRow("Username", "userName")}
                    {renderRow("Gender", "gender")}
                    {renderRow("Date of Birth", "dob")}
                    {renderRow("Mobile Number", "mobileNumber")}
                    {renderRow("Email", "email")}
                    {renderRow("Bio", "bio", "textarea")}
                    {renderRow("Active", "isActive", "switch")}
                    {renderRow("Verified", "isVerified", "switch")}
                    {renderInterestsRow()}
                    {renderRow("Wallet", "wallet")}
                    {renderRow("Referral Code", "referralCode")}
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
                      <Link
                        href={`/dashboard/myst-profiles/${user._id}`}
                        className="flex items-center justify-center gap-3 px-2 py-2 bg-neutral-300 rounded-md"
                      >
                        {" "}
                        <ArrowUpRightFromSquare size={14} /> Manage Content
                      </Link>
                      <Button onClick={handleEdit}>Edit</Button>
                    </>
                  )}
                </div>
              </Card>
              <Card className="w-full px-5">
                <CustomDialog
                  title="Are you sure?"
                  description="This action cannot be undone. This will permanently delete the user and all associated data."
                  trigger={
                    <Button variant="destructive">Delete Profile</Button>
                  }
                  footer={
                    <Button variant="destructive" onClick={handleDelete}>
                      Yes, Delete
                    </Button>
                  }
                />
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
