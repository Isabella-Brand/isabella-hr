import { NextRequest, NextResponse } from "next/server";
import { createEmployee } from "@/lib/employees";

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, country, startDate, telegramHandle, crmName } = await req.json();

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: "First name, last name and email are required" }, { status: 400 });
    }

    const employee = await createEmployee({ firstName, lastName, email, country, startDate, telegramHandle, crmName });
    return NextResponse.json({ success: true, employee });
  } catch (err: any) {
    // Unique constraint violation = duplicate email
    if (err.message?.includes("duplicate") || err.message?.includes("unique")) {
      return NextResponse.json({ error: "An employee with this email already exists" }, { status: 409 });
    }
    console.error("onboarding error:", err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
