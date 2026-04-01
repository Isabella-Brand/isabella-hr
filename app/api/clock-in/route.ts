import { NextRequest, NextResponse } from "next/server";
import { clockIn, getOpenClockIn } from "@/lib/sheets";
import { getCurrentShift } from "@/lib/roster";

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const shift = getCurrentShift();

    // Check if already clocked in
    const existing = await getOpenClockIn(name);
    if (existing) {
      return NextResponse.json(
        { error: "Already clocked in", record: existing },
        { status: 409 }
      );
    }

    const record = await clockIn(name, shift as Shift);
    return NextResponse.json({ success: true, record });
  } catch (err: any) {
    console.error("clock-in error:", err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
