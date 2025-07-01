"use client";

import { useEffect, useState } from "react";
import { UserType } from "../users/columns";
import { UserTable } from "../users/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, UserCheck, ExternalLink } from "lucide-react";
import { handleAPICall, methodENUM } from "@/lib/api-utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MystProfilesPage() {
  const [userData, setUserData] = useState<UserType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState({
    totalAssigned: 0,
    activeUsers: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await handleAPICall("/api/users/assigned", methodENUM.GET);
        if (data) {
          setUserData(data);

          // Calculate stats
          setStats({
            totalAssigned: data?.length || 0,
            activeUsers:
              data?.filter((user: UserType) => user.isActive).length ||
              0,
          });
        }
      } catch (error) {
        console.error("Error fetching assigned users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-4 w-full h-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">My Assigned Profiles</h1>
        <p className="text-muted-foreground">
          Manage the social media profiles assigned to you for content
          management and updates.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Assigned
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssigned}</div>
            <p className="text-xs text-muted-foreground">
              Profiles assigned to you
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Currently active profiles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Profiles</CardTitle>
          <CardDescription>
            View and manage the social media profiles assigned to you for
            content management.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {/* Repeat 5 rows for skeleton table */}
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="grid grid-cols-7 gap-4">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </div>
          ) : !userData || userData.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No profiles assigned</h3>
              <p className="text-muted-foreground">
                You don't have any social media profiles assigned to you yet.
                Contact your administrator to get profiles assigned.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {userData.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      {user.avatarURL ? (
                        <img
                          src={user.avatarURL}
                          alt={user.fullName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <Users className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{user.fullName}</h3>
                      <p className="text-sm text-muted-foreground">
                        @{user.userName}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {user.posts} posts
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {user.followers} followers
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            user.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link href={`/dashboard/myst-profiles/${user._id}`}>
                      <Button variant="outline" className="cursor-pointer" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Manage Content
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
