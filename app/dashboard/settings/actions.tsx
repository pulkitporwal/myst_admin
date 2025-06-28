import { api, TOAST_CONFIGS } from "@/lib/api-utils";

export const handleAddPermission = async (permission: {
  name: string;
  description: string;
}) => {
  const result = await api.post("/api/permissions", permission, {
    ...TOAST_CONFIGS.create,
    successMessage: "Permission created successfully",
  });

  return result.data;
};

export const fetchPermissionSettings = async () => {
  const result = await api.get("/api/permissions", TOAST_CONFIGS.fetch);
  return result.data;
};

export const handleDeletePermission = async (id: string) => {
  const result = await api.delete(`/api/permissions/${id}`, {
    ...TOAST_CONFIGS.delete,
    successMessage: "Permission deleted successfully",
  });

  return result.data;
};
