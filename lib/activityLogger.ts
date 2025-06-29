import { dbConnect } from "./dbConnect";
import { ActivityModel } from "@/models/Activities";

export interface ActivityLogData {
  userId: string;
  activityType: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logActivity(activityData: ActivityLogData) {
  try {
    await dbConnect();
    const activity = await ActivityModel.create(activityData);
    return activity;
  } catch (error) {
    console.error("Error logging activity:", error);
    // Don't throw error to avoid breaking the main flow
    return null;
  }
}

// Common activity types
export const ActivityTypes = {
  USER_LOGIN: "USER_LOGIN",
  USER_LOGOUT: "USER_LOGOUT",
  USER_CREATED: "USER_CREATED",
  USER_UPDATED: "USER_UPDATED",
  USER_DELETED: "USER_DELETED",
  CONTENT_CREATED: "CONTENT_CREATED",
  CONTENT_UPDATED: "CONTENT_UPDATED",
  CONTENT_DELETED: "CONTENT_DELETED",
  CONTENT_REPORTED: "CONTENT_REPORTED",
  PERMISSION_CREATED: "PERMISSION_CREATED",
  PERMISSION_UPDATED: "PERMISSION_UPDATED",
  PERMISSION_DELETED: "PERMISSION_DELETED",
  ADMIN_USER_CREATED: "ADMIN_USER_CREATED",
  ADMIN_USER_UPDATED: "ADMIN_USER_UPDATED",
  ADMIN_USER_DELETED: "ADMIN_USER_DELETED",
  ADMIN_USER_ACTIVATED: "ADMIN_USER_ACTIVATED",
  ADMIN_USER_REJECTED: "ADMIN_USER_REJECTED",
  TASK_CREATED: "TASK_CREATED",
  TASK_UPDATED: "TASK_UPDATED",
  TASK_DELETED: "TASK_DELETED",
  TASK_STARTED: "TASK_STARTED",
  TASK_COMPLETED: "TASK_COMPLETED",
  TASK_APPROVED: "TASK_APPROVED",
  TASK_REJECTED: "TASK_REJECTED",
  MODERATION_ACTION: "MODERATION_ACTION",
  ACTIVITY_CREATED: "ACTIVITY_CREATED",
  ACTIVITY_UPDATED: "ACTIVITY_UPDATED",
  ACTIVITY_DELETED: "ACTIVITY_DELETED",
  ACTIVITY_VIEWED: "ACTIVITY_VIEWED",
} as const;

// Helper function to get client IP and user agent
export function getClientInfo(request: Request) {
  const headers = request.headers;
  const userAgent = headers.get('user-agent') || '';
  
  // Try to get IP from various headers (for different proxy setups)
  const forwarded = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');
  const ip = forwarded ? forwarded.split(',')[0] : realIp || 'unknown';
  
  return { ipAddress: ip, userAgent };
}
