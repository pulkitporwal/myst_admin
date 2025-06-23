import React from "react";
import { SidebarTrigger } from "./ui/sidebar";
import { Button } from "./ui/button";
import { Download, Plus } from "lucide-react";

const AppHeader = () => {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex flex-1 items-center gap-2">
        <h1 className="text-lg font-semibold">Admin Dashboard</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Action
        </Button>
      </div>
    </header>
  );
};

export default AppHeader;
