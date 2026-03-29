import { NextRequest, NextResponse } from "next/server";
import { clockOut, getOpenClockIn } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    // Find open clock-in
    const existing = await getOpenClockIn(name);
    if (!existing) {
      return NextResponse.json(
        { error: "No active clock-in found for today" },
        { status: 404 }
      );
    }

    const record = await clockOut(existing.id, existing.clockIn);
    return NextResponse.json({ success: true, record });
  } catch (err: any) {
    console.error("clock-out error:", err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
