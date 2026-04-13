import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllEmployees, getEmployeeById, updateEmployee, deleteEmployee } from "@/lib/employees";
import type { EmployeeStatus, EmployeeRole, EmployeeShift } from "@/lib/employees";
import { addToSupergroup, removeFromSupergroup } from "@/lib/telegram";

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
    const { id, firstName, lastName, email, country, startDate, telegramHandle, telegramUserId,
            status, gustoAcc, crmName, deactivatedDate, role, shiftAssigned } = await req.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    // Fetch current record before update so we can detect status changes
    const before = await getEmployeeById(id);

    await updateEmployee(id, {
      firstName, lastName, email, country, startDate, telegramHandle, telegramUserId,
      status:       status       as EmployeeStatus,
      gustoAcc,     crmName,     deactivatedDate,
      role:         role         as EmployeeRole,
      shiftAssigned: shiftAssigned as EmployeeShift,
    });

    // Trigger Telegram group management when status changes
    if (status !== undefined && before && before.status !== status) {
      // Fetch fresh record to get the latest telegramUserId and role
      const after = await getEmployeeById(id);
      const tgId  = after?.telegramUserId ?? before.telegramUserId;
      const empRole = after?.role ?? before.role;

      if (tgId) {
        try {
          if (status === "Active" && empRole) {
            await addToSupergroup(tgId);
          } else if (status === "Deactivated") {
            await removeFromSupergroup(tgId);
          }
        } catch (tgErr: any) {
          // Log but don't fail the HR update if Telegram call fails
          console.error("Telegram sync error:", tgErr.message);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("employees PATCH error:", err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    await deleteEmployee(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("employees DELETE error:", err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
