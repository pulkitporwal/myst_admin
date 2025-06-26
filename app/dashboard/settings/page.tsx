"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ArrowDown, ChevronDown, Plus, Trash, UserLock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import CustomDialog from "@/components/reusable-dialog";
import { handleAddPermission } from "./actions";
import PermissionComponent from "./components/permissions";
import ProfileComponent from "./components/profile";
import AccountPreferencesComponent from "./components/account-preferences";

export default function SettingsPage() {
  const [settingsInfo, setSettingsInfo] = useState({ permission: [] });

  

  console.log(settingsInfo);

  return (
    <div className="p-6 w-full mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="general">
          <div className="flex flex-col gap-5">
            <PermissionComponent settingsInfo={settingsInfo} setSettingsInfo={setSettingsInfo} />
            <AccountPreferencesComponent />
          </div>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="account">
          <div className="flex flex-col gap-5">
            <ProfileComponent settingsInfo={settingsInfo} setSettingsInfo={setSettingsInfo} />
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Current Password</Label>
                <Input type="password" placeholder="Current password" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>New Password</Label>
                  <Input type="password" placeholder="New password" />
                </div>
                <div>
                  <Label>Confirm Password</Label>
                  <Input type="password" placeholder="Confirm new password" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline">Cancel</Button>
                <Button>Update Password</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
