import { NextResponse } from "next/server";
import { getAllClockedIn, getTodayAttendance } from "@/lib/sheets";
import { getAllCurrentBreaks } from "@/lib/breaks";

export async function GET() {
  try {
    const [active, today, breaks] = await Promise.all([
      getAllClockedIn(),
      getTodayAttendance(),
      getAllCurrentBreaks(),
    ]);
    return NextResponse.json({ active, today, breaks });
  } catch (err: any) {
    console.error("dashboard error:", err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
