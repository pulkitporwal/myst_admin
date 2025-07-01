import { handleAPICall, methodENUM } from "@/lib/api-utils";

export const handleAddPermission = async (permission: {
  name: string;
  description: string;
}) => {
  const data = await handleAPICall("/api/permissions", methodENUM.POST, permission);
  return data;
};

export const fetchPermissionSettings = async () => {
  const data = await handleAPICall("/api/permissions", methodENUM.GET);
  return data;
};

export const handleDeletePermission = async (id: string) => {
  const data = await handleAPICall(`/api/permissions/${id}`, methodENUM.DELETE);
  return data;
};
