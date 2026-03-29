import { NextResponse } from "next/server";
import { getActiveClockInEmployees } from "@/lib/employees";

export async function GET() {
  try {
    const employees = await getActiveClockInEmployees();
    return NextResponse.json({ employees });
  } catch (err: any) {
    console.error("active-employees error:", err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
