import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// GET /api/partners/[partnerId]/vehicles - Get all vehicles for a partner
export async function GET(
  req: NextRequest,
  { params }: { params: { partnerId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const partnerId = params.partnerId;

    // Check if partner exists
    const partner = await db.partner.findUnique({
      where: { id: partnerId },
    });

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    // Get vehicles for the partner
    const vehicles = await db.vehicle.findMany({
      where: { partnerId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error("Error fetching partner vehicles:", error);
    return NextResponse.json(
      { error: "Failed to fetch vehicles" },
      { status: 500 }
    );
  }
}

// POST /api/partners/[partnerId]/vehicles - Add a vehicle to a partner
export async function POST(
  req: NextRequest,
  { params }: { params: { partnerId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const partnerId = params.partnerId;
    const data = await req.json();

    // Check if partner exists
    const partner = await db.partner.findUnique({
      where: { id: partnerId },
    });

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    // Validate required fields
    if (!data.brand || !data.model || !data.year || !data.licensePlate) {
      const missingFields = [];
      if (!data.brand) missingFields.push('brand');
      if (!data.model) missingFields.push('model');
      if (!data.year) missingFields.push('year');
      if (!data.licensePlate) missingFields.push('licensePlate');

      console.error(`Missing required fields: ${missingFields.join(', ')}`, data);

      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if license plate is already in use
    const existingVehicle = await db.vehicle.findUnique({
      where: { licensePlate: data.licensePlate },
    });

    if (existingVehicle) {
      return NextResponse.json(
        { error: "A vehicle with this license plate already exists" },
        { status: 400 }
      );
    }

    // Process numeric fields
    const year = parseInt(data.year);
    const capacity = parseInt(data.capacity);

    // Create the vehicle
    const vehicle = await db.vehicle.create({
      data: {
        make: data.brand, // Using brand field but mapping to make in the database
        model: data.model,
        year,
        licensePlate: data.licensePlate,
        isForeignPlate: data.isForeignPlate || false,
        color: data.color,
        capacity,
        vehicleType: data.vehicleType || "SEDAN",
        status: data.status || "AVAILABLE",
        lastMaintenance: data.lastMaintenance ? new Date(data.lastMaintenance) : null,
        partnerId,
        // Store additional data from the API if available
        fuelType: data.fuelType,
        registrationDate: data.registrationDate,
      },
    });

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error("Error adding vehicle:", error);
    return NextResponse.json(
      { error: "Failed to add vehicle" },
      { status: 500 }
    );
  }
}
