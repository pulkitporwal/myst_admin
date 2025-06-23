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

  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setLoading(true);
      setUser(undefined);
      try {
        const res = await fetch(`/api/users/${userId}`);
        const data = await res.json();
        setUser(data.data);
      } catch (e) {
        setUser(undefined);
      }
      setLoading(false);
    }
  };

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
        <div className="w-full px-5 h-full overflow-hidden pb-5">
          {loading ? (
            <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
        </div>
          ) : user ? (
            <div>
              <img
                src={user.avatarURL}
                alt={user.fullName}
                className="w-20 h-20 rounded-full mb-2"
              />
              <div>
                <h2 className="font-bold">{user.fullName}</h2>
                <p>@{user.userName}</p>
                <p>{user.email}</p>
                <p>{user.bio}</p>
                {/* Add more fields as needed */}
              </div>
            </div>
          ) : (
            <div>No user data found.</div>
          )}
          {/* <SheetClose asChild>
          <Button className="mt-4" variant="secondary">
          Close
          </Button>
          </SheetClose> */}
        </div>
      </SheetContent>
    </Sheet>
  );
}
