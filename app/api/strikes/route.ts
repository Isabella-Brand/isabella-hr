import { NextRequest, NextResponse } from "next/server";
import { createStrike, getEmployeeStrikes, getAllStrikeCounts } from "@/lib/strikes";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  try {
    if (employeeId) {
      const strikes = await getEmployeeStrikes(employeeId);
      return NextResponse.json({ strikes });
    } else {
      const counts = await getAllStrikeCounts();
      return NextResponse.json({ counts });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { employeeId, employeeName, reason, description, issuedBy } = await req.json();
    if (!employeeId || !employeeName || !reason) {
      return NextResponse.json({ error: "employeeId, employeeName, and reason are required" }, { status: 400 });
    }
    const strike = await createStrike({ employeeId, employeeName, reason, description, issuedBy });
    return NextResponse.json({ success: true, strike });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
