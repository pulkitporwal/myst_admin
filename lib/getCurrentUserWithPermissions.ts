import { Permission } from "@/models/Permission";
import { AdminUser } from "@/models/AdminUser";
import { dbConnect } from "./dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const getCurrentUserWithPermissions = async () => {
  await dbConnect();

  Permission.modelName;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const user = await AdminUser.findById(session.user.id).populate("permissions");
  return user;
};
