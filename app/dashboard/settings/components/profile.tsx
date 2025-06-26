import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";
import React from "react";

const ProfileComponent = ({ settingsInfo, setSettingsInfo }: any) => {
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-start gap-4 text-xl">
            <User />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>PP</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start justify-start">
              <Button variant="outline">Upload New</Button>
              <p className="text-xs text-muted-foreground mt-2">
                Allowed JPG, PNG. Max size 2MB
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col items-start justify-start gap-2">
              <Label>Full Name</Label>
              <Input placeholder="Your Name" />
            </div>
            <div className="flex flex-col items-start justify-start gap-2">
              <Label>Email</Label>
              <Input placeholder="you@example.com" />
            </div>
          </div>
          <div className="flex flex-col items-start justify-start gap-2">
            <Label>Bio</Label>
            <Input placeholder="Tell us something about you..." />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline">Cancel</Button>
            <Button>Save</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileComponent;
