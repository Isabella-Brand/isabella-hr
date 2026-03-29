import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllEmployees, updateEmployee } from "@/lib/employees";
import type { EmployeeStatus, EmployeeRole, EmployeeShift } from "@/lib/employees";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const employees = await getAllEmployees();
    return NextResponse.json({ employees });
  } catch (err: any) {
    console.error("employees GET error:", err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id, status, gustoAcc, deactivatedDate, role, shiftAssigned } = await req.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    await updateEmployee(id, {
      status: status as EmployeeStatus,
      gustoAcc,
      deactivatedDate,
      role: role as EmployeeRole,
      shiftAssigned: shiftAssigned as EmployeeShift,
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("employees PATCH error:", err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
