"use client";

import CustomDialog from "@/components/reusable-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Plus, Trash, UserLock } from "lucide-react";
import React, { useEffect } from "react";
import {
  fetchPermissionSettings,
  handleAddPermission,
  handleDeletePermission,
} from "../actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const PermissionComponent = ({ settingsInfo, setSettingsInfo }: any) => {
  const [permName, setPermName] = React.useState("");
  const [permDesc, setPermDesc] = React.useState("");

  useEffect(() => {
    const fetchAll = async () => {
      const data = await fetchPermissionSettings();
      setSettingsInfo({ ...settingsInfo, permission: data });
    };

    fetchAll();
  }, []);
  return (
    <div>
      <Card className="">
        <Collapsible className="">
          <CollapsibleTrigger className="cursor-pointer w-full">
            <CardHeader>
              <CardTitle className="flex w-full justify-between">
                <div className="flex items-center justify-start gap-4 w-full">
                  <UserLock /> Permissions
                </div>
                <ChevronDown />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="mt-4">
              <Card>
                <CardHeader>
                  <div className="w-full flex justify-between items-center">
                    <h2 className="text-lg font-semibold">All Permissions</h2>

                    <CustomDialog
                      title="Add New Permission"
                      description="Fill in the details to add a permission"
                      trigger={
                        <Button className="cursor-pointer flex items-center justify-between">
                          <Plus className="mr-2 md:mr-0 h-4 w-4 md:h-3 md:2-3 " />
                          <span className="hidden md:block">Add Permission</span>
                        </Button>
                      }
                      footer={
                        <>
                          <Button
                            className="cursor-pointer"
                            onClick={async () => {
                              console.log(
                                await handleAddPermission({
                                  name: permName,
                                  description: permDesc,
                                })
                              );

                              console.log("PERM");

                              const data = await fetchPermissionSettings();
                              setSettingsInfo({
                                ...settingsInfo,
                                permission: data,
                              });

                              // Clear form inputs
                              setPermName("");
                              setPermDesc("");
                            }}
                          >
                            Add
                          </Button>
                        </>
                      }
                    >
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="perm-name">Permission Name</Label>
                          <Input
                            value={permName}
                            onChange={(e) => setPermName(e.target.value)}
                            id="perm-name"
                            placeholder="e.g., delete-user"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="perm-desc">Description</Label>
                          <Input
                            value={permDesc}
                            onChange={(e) => setPermDesc(e.target.value)}
                            id="perm-desc"
                            placeholder="Short description..."
                          />
                        </div>
                      </div>
                    </CustomDialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Permssion</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {settingsInfo?.permission?.length > 0 ? (
                        settingsInfo?.permission?.map((perm: any) => (
                          <TableRow key={perm._id}>
                            <TableCell className="font-medium">
                              {perm.name}
                            </TableCell>
                            <TableCell>{perm.description}</TableCell>
                            <TableCell>
                              <Popover>
                                <PopoverTrigger className="bg-red-500 px-2 py-1 rounded-md text-white cursor-pointer flex items-center justify-between gap-2">
                                  <Trash size={14} />
                                  Delete
                                </PopoverTrigger>
                                <PopoverContent className="w-64 space-y-2 p-4">
                                  <div className="text-sm font-medium">
                                    Are you sure?
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    This action cannot be reversible.
                                  </p>
                                  <div className="flex justify-end gap-2 mt-3">
                                    <Button
                                      onClick={() =>
                                        handleDeletePermission(perm._id).then(
                                          () => {
                                            fetchPermissionSettings().then(
                                              (data) => {
                                                setSettingsInfo({
                                                  ...settingsInfo,
                                                  permission: data,
                                                });
                                              }
                                            );
                                          }
                                        )
                                      }
                                      variant="destructive"
                                      size="sm"
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow className="mt-4">
                          <TableCell
                            colSpan={3}
                            className="text-center mt-4 text-muted-foreground"
                          >
                            No permissions found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
};

export default PermissionComponent;
