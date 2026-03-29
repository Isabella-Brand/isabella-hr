import { NextRequest, NextResponse } from "next/server";
import { clockIn, getOpenClockIn } from "@/lib/sheets";
import { TEAM_ROSTER } from "@/lib/roster";
import type { Shift } from "@/lib/roster";

export async function POST(req: NextRequest) {
  try {
    const { name, shift } = await req.json();

    if (!name || !shift) {
      return NextResponse.json({ error: "name and shift are required" }, { status: 400 });
    }

    const validMember = TEAM_ROSTER.find((m) => m.name === name);
    if (!validMember) {
      return NextResponse.json({ error: "Person not found in roster" }, { status: 400 });
    }

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
