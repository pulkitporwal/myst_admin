import React from "react";
import { SidebarTrigger } from "./ui/sidebar";
import { Button } from "./ui/button";
import { Download, Plus, Power } from "lucide-react";
import { signOut } from "next-auth/react";

const AppHeader = () => {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex flex-1 items-center gap-2">
        <h1 className="text-lg font-semibold">Admin Dashboard</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={()=> signOut()} className="cursor-pointer" size="sm">
          <Power className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  );
};

export default AppHeader;
