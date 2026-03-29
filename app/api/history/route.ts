import { NextRequest, NextResponse } from "next/server";
import { getAttendanceRange } from "@/lib/sheets";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate   = searchParams.get("endDate");
  const startHour = searchParams.get("startHour");
  const endHour   = searchParams.get("endHour");

  if (!startDate || !endDate) {
    return NextResponse.json({ error: "startDate and endDate are required" }, { status: 400 });
  }

  try {
    const records = await getAttendanceRange(
      startDate,
      endDate,
      startHour !== null ? parseInt(startHour) : undefined,
      endHour   !== null ? parseInt(endHour)   : undefined
    );

    // Per-person totals
    const map: Record<string, { sessions: number; hours: number; shift: string }> = {};
    for (const r of records) {
      if (!map[r.name]) map[r.name] = { sessions: 0, hours: 0, shift: r.shift };
      map[r.name].sessions++;
      map[r.name].hours += r.hoursWorked ?? 0;
    }
    const totals = Object.entries(map)
      .map(([name, v]) => ({ name, shift: v.shift, sessions: v.sessions, hours: parseFloat(v.hours.toFixed(2)) }))
      .sort((a, b) => b.hours - a.hours);

    return NextResponse.json({ records, totals });
  } catch (err: any) {
    console.error("history error:", err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
