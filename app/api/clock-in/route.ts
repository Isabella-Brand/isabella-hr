import { NextRequest, NextResponse } from "next/server";
import { clockIn, getOpenClockIn } from "@/lib/sheets";
import { getCurrentShift, type Shift } from "@/lib/roster";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    // Use the employee's assigned shift; fall back to time-based detection
    const nameParts = name.trim().split(" ");
    const { data: emp } = await db
      .from("employees")
      .select("shift_assigned")
      .ilike("first_name", nameParts[0])
      .ilike("last_name", nameParts.slice(1).join(" "))
      .maybeSingle();

    const shift: Shift = (emp?.shift_assigned as Shift) || getCurrentShift();

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
