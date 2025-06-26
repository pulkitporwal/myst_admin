import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, Cog } from "lucide-react";
import React from "react";

const AccountPreferencesComponent = () => {
  return (
    <div>
      <Card className="">
        <Collapsible className="">
          <CollapsibleTrigger className="cursor-pointer w-full">
            <CardHeader>
              <CardTitle className="flex w-full justify-between">
                <div className="flex items-center justify-start gap-4 w-full">
                  <Cog /> Account Preferences
                </div>
                <ChevronDown />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <Card className="mt-4">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Label>Dark Mode</Label>
                    <Switch />
                  </div>

                  <div className="flex justify-end gap-2 mt-5 pt-4">
                    <Button variant="outline">Cancel</Button>
                    <Button>Save Changes</Button>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
};

export default AccountPreferencesComponent;
