import { NextRequest, NextResponse } from "next/server";
import { startBreak, getOpenBreak } from "@/lib/breaks";
import { getOpenClockIn } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

    const clockIn = await getOpenClockIn(name);
    if (!clockIn) return NextResponse.json({ error: "Not clocked in" }, { status: 400 });

    const existing = await getOpenBreak(name);
    if (existing) return NextResponse.json({ error: "Already on break" }, { status: 409 });

    const record = await startBreak(name, clockIn.id);
    return NextResponse.json({ success: true, record });
  } catch (err: any) {
    console.error("break-start error:", err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
