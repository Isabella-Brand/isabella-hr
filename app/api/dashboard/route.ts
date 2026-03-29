import { NextResponse } from "next/server";
import { getAllClockedIn, getTodayAttendance } from "@/lib/sheets";

export async function GET() {
  try {
    const [active, today] = await Promise.all([
      getAllClockedIn(),
      getTodayAttendance(),
    ]);
    return NextResponse.json({ active, today });
  } catch (err: any) {
    console.error("dashboard error:", err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
