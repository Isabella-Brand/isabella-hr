import { NextRequest, NextResponse } from "next/server";
import { getAllActiveEmployees, updateEmployee } from "@/lib/employees";

export async function GET() {
  try {
    const employees = await getAllActiveEmployees();
    return NextResponse.json({ employees });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { employeeId, telegramUserId } = await req.json();
    if (!employeeId || !telegramUserId) {
      return NextResponse.json({ error: "employeeId and telegramUserId are required" }, { status: 400 });
    }
    if (!/^\d+$/.test(String(telegramUserId).trim())) {
      return NextResponse.json({ error: "Telegram User ID must be a number" }, { status: 400 });
    }
    await updateEmployee(employeeId, { telegramUserId: String(telegramUserId).trim() });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
