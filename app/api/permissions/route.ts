import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { Permission } from "@/models/Permission";
import { getCurrentUserWithPermissions } from "@/lib/getCurrentUserWithPermissions";
import { ActivityTypes, getClientInfo, logActivity } from "@/lib/activityLogger";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    
    // Query parameters for filtering
    const name = searchParams.get('name');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }

    const permissions = await Permission.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Permission.countDocuments(query);

    return NextResponse.json({ 
      success: true, 
      data: permissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: "Permission name is required" },
        { status: 400 }
      );
    }

    // Ensure name is uppercase
    body.name = body.name.toUpperCase().trim();

    const newPermission = await Permission.create(body);
    
    // Log activity
    const currentUser = await getCurrentUserWithPermissions();
    const clientInfo = getClientInfo(request);
    
    if (currentUser?.user?._id) {
      await logActivity({
        userId: currentUser.user._id.toString(),
        activityType: ActivityTypes.PERMISSION_CREATED,
        description: `Created permission: ${newPermission.name}`,
        metadata: { permissionId: newPermission._id, permissionName: newPermission.name },
        ...clientInfo
      });
    }

    return NextResponse.json(
      { success: true, data: newPermission },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating permission:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Permission with this name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
} 