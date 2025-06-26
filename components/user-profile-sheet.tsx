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
import { Table } from "./ui/table";
import { Card } from "./ui/card";

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
            <div className="w-full h-ful gap-4 flex items-center flex-col justify-start">
              <div className="w-full flex flex-col items-center justify-center gap-5 ">
                {user.avatarURL ? (
                  <Image
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
              <Card className="grid grid-cols-3 justify-between w-full mt-10 rounded-md border bg-neutral-100 py-1 border-neutral-300">
                <div className="flex items-center justify-center gap-1  py-2 flex-col ">
                  <h4 className="font-bold text-[10px] md:text-xs">POSTS</h4>
                  <h4 className="text-lg md:text-xl">5500</h4>
                </div>
                <div className="flex items-center justify-center gap-1  py-2 flex-col ">
                  <h4 className="font-bold text-[10px] md:text-xs">FOLLOWERS</h4>
                  <h4 className="text-lg md:text-xl">5500</h4>
                </div>
                <div className="flex items-center justify-center gap-1  py-2 flex-col ">
                  <h4 className="font-bold text-[10px] md:text-xs">FOLLOWING</h4>
                  <h4 className="text-lg md:text-xl">5500</h4>
                </div>
              </Card>
              <Card className="flex w-full items-center justify-center flex-col">
                <Table>

                </Table>
              </Card>
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
