import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { UserModel } from "@/models/User";
import { ContentModel } from "@/models/Content";
import { ContentReportModel } from "@/models/ReportContent";
import { getCurrentUserWithPermissions } from "@/lib/getCurrentUserWithPermissions";
import { checkAnyPermission, createAnyPermissionErrorResponse } from "@/lib/checkPermissions";
import { ActivityTypes, getClientInfo, logActivity } from "@/lib/activityLogger";

export async function GET(request: Request) {
  try {
    await dbConnect();

    const currentUser = await getCurrentUserWithPermissions();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Super-admin bypasses permission checks
    if (currentUser.role === "super-admin") {
      const reports = await ContentReportModel.aggregate([
        {
          $lookup: {
            from: "users", // collection name in MongoDB
            localField: "user_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" }, // if you want user as a single object, not array
        {
          $project: {
            reason: 1,
            status: 1,
            createdAt: 1,
            user: {
              _id: 1,
              fullName: 1,
              userName: 1,
              avatarURL: 1,
            },
            content_id: 1, // will be replaced by next $lookup
          },
        },
        {
          $lookup: {
            from: "contents", // collection name (MUST be lowercase and plural)
            localField: "content_id",
            foreignField: "_id",
            as: "content",
          },
        },
        { $unwind: "$content" }, // make content a single object instead of array
        {
          $project: {
            reason: 1,
            status: 1,
            createdAt: 1,
            user: 1,
            content: {
              _id: 1,
              content_url: 1,
              caption: 1,
              category: 1,
              thumbnail_url: 1,
            },
          },
        },
      ]);

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.ACTIVITY_VIEWED,
        description: "Viewed moderation reports list (Super Admin)",
        metadata: { count: reports.length },
        ...getClientInfo(request)
      });

      return NextResponse.json({ success: true, data: reports }, { status: 200 });
    }

    // Admin and Manager roles need specific permissions
    if (currentUser.role === "admin" || currentUser.role === "manager") {
      const permissionCheck = await checkAnyPermission(["CONTENT_VIEW", "SUPER_ADMIN"]);
      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          createAnyPermissionErrorResponse(["CONTENT_VIEW", "SUPER_ADMIN"], permissionCheck.permissions),
          { status: 403 }
        );
      }

      const reports = await ContentReportModel.aggregate([
        {
          $lookup: {
            from: "users", // collection name in MongoDB
            localField: "user_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" }, // if you want user as a single object, not array
        {
          $project: {
            reason: 1,
            status: 1,
            createdAt: 1,
            user: {
              _id: 1,
              fullName: 1,
              userName: 1,
              avatarURL: 1,
            },
            content_id: 1, // will be replaced by next $lookup
          },
        },
        {
          $lookup: {
            from: "contents", // collection name (MUST be lowercase and plural)
            localField: "content_id",
            foreignField: "_id",
            as: "content",
          },
        },
        { $unwind: "$content" }, // make content a single object instead of array
        {
          $project: {
            reason: 1,
            status: 1,
            createdAt: 1,
            user: 1,
            content: {
              _id: 1,
              content_url: 1,
              caption: 1,
              category: 1,
              thumbnail_url: 1,
            },
          },
        },
      ]);

      await logActivity({
        userId: currentUser._id.toString(),
        activityType: ActivityTypes.ACTIVITY_VIEWED,
        description: `Viewed moderation reports list (${currentUser.role})`,
        metadata: { count: reports.length },
        ...getClientInfo(request)
      });

      return NextResponse.json({ success: true, data: reports }, { status: 200 });
    }

    // For all other roles, deny access
    return NextResponse.json(
      { success: false, error: "Access denied" },
      { status: 403 }
    );
  } catch (error) {
    console.error("Error fetching moderation reports:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch moderation reports" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const report = await ContentReportModel.create(body);
    return NextResponse.json({ success: true, data: report }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create report" },
      { status: 500 }
    );
  }
}
