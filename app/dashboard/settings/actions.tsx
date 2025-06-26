export const handleAddPermission = async (permission: {
  name: string;
  description: string;
}) => {
  const response = await fetch("/api/permissions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(permission),
  });

  const { data } = await response.json();
  return data;
};

export const fetchPermissionSettings = async () => {
  const response = await fetch("/api/permissions");
  const { data } = await response.json();

  return data;
};

export const handleDeletePermission = async (id: string) => {
  const response = await fetch(`/api/permissions/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });

  const { data } = await response.json();
  return data;
};
