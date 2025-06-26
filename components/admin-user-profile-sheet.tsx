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
import { Card, CardHeader } from "./ui/card";
import { BriefcaseBusiness, Clapperboard } from "lucide-react";

export function AdminUserProfileSheet({
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
        const res = await fetch(`/api/admin-users/${userId}`);
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
      <SheetContent className="h-[100%] px-2 py-3">
        <SheetHeader className="h-[5%]">
          <SheetTitle>
            {user
              ? `${user?.fullName.toUpperCase()}'s INFORMATION`
              : "ADMIN USER INFORMATION"}
          </SheetTitle>
        </SheetHeader>
        <div className="w-full pl-4 overflow-hidden pb-5 h-[75%] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
            </div>
          ) : user ? (
            <div className="w-full pl-4 overflow-hidden pb-5 h-full overflow-y-auto">
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
             <div></div>
          )}
          {/* <SheetClose asChild>
          <Button className="mt-4" variant="secondary">
          Close
          </Button>
          </SheetClose> */}
        </div>
        <div className="w-full h-[20%]">
          <Card className="w-full h-full px-5">
            <div className="">
              <div className="w-full flex items-center justify-start gap-3 uppercase font-semibold">
                <BriefcaseBusiness size={16} />
                <h3 className="text-sm">Admin Actions</h3>
              </div>
            </div>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
