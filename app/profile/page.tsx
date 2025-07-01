"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    profileImage: "",
  });

  useEffect(() => {
    fetch("/api/auth/current")
      .then((res) => res.json())
      .then((data) => {

        console.log(data);
        if (data) {
          setUser(data);
          setForm({
            fullName: data.fullName || "",
            email: data.email || "",
            phoneNumber: data.phoneNumber || "",
            profileImage: data.profileImage || "",
          });
          fetch(`/api/activities?userId=${data._id}`)
            .then((res) => res.json())
            .then((act) => setActivities(act.data || []));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Profile updated successfully");
        setUser(data);
      } else {
        toast.error(data.error || "Failed to update profile");
      }
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto mt-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSave}>
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <Input name="fullName" value={form.fullName} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input name="email" value={form.email} onChange={handleChange} type="email" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              <Input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Profile Image URL</label>
              <Input name="profileImage" value={form.profileImage} onChange={handleChange} />
            </div>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          {user?.permissions?.length ? (
            <ul className="list-disc pl-5 space-y-1">
              {user?.permissions.map((perm: any) => (
                <li key={perm._id}><b>{perm.name}</b>: {perm.description}</li>
              ))}
            </ul>
          ) : (
            <div className="text-muted-foreground">No permissions assigned.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length ? (
            <ul className="divide-y">
              {activities.slice(0, 10).map((act) => (
                <li key={act._id} className="py-2">
                  <div className="font-medium">{act.activityType}</div>
                  <div className="text-sm text-muted-foreground">{act.description}</div>
                  <div className="text-xs text-gray-400">{act.createdAt ? new Date(act.createdAt).toLocaleString() : ""}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-muted-foreground">No recent activities.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 