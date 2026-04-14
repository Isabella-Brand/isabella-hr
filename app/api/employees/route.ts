import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllEmployees, getEmployeeById, updateEmployee, deleteEmployee } from "@/lib/employees";
import type { EmployeeStatus, EmployeeRole, EmployeeShift } from "@/lib/employees";
import { addToSupergroup, removeFromSupergroup } from "@/lib/telegram";

export type TelegramSyncResult =
  | { triggered: false }
  | { triggered: true; action: "add" | "remove"; result: "success"; employeeName: string }
  | { triggered: true; action: "add" | "remove"; result: "failed";  employeeName: string; error: string }
  | { triggered: true; action: "add" | "remove"; result: "skipped"; employeeName: string; reason: string };

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

    const before = await getEmployeeById(id);

    await updateEmployee(id, {
      firstName, lastName, email, country, startDate, telegramHandle, telegramUserId,
      status:        status        as EmployeeStatus,
      gustoAcc,      crmName,      deactivatedDate,
      role:          role          as EmployeeRole,
      shiftAssigned: shiftAssigned as EmployeeShift,
    });

    let telegramSync: TelegramSyncResult = { triggered: false };

    if (status !== undefined && before && before.status !== status) {
      const after      = await getEmployeeById(id);
      const tgId       = after?.telegramUserId ?? before.telegramUserId;
      const empRole    = after?.role ?? before.role;
      const empName    = `${before.firstName} ${before.lastName}`.trim();
      const action     = status === "Active" ? "add" : "remove";

      if (!tgId) {
        telegramSync = { triggered: true, action, result: "skipped", employeeName: empName,
          reason: "No Telegram User ID on file — ask them to submit via the /update-tg link." };
      } else if (action === "add" && !empRole) {
        telegramSync = { triggered: true, action, result: "skipped", employeeName: empName,
          reason: "No role assigned yet. Assign a role first, then re-activate." };
      } else {
        try {
          if (action === "add") {
            await addToSupergroup(tgId);
          } else {
            await removeFromSupergroup(tgId);
          }
          telegramSync = { triggered: true, action, result: "success", employeeName: empName };
        } catch (tgErr: any) {
          console.error("Telegram sync error:", tgErr.message);
          telegramSync = { triggered: true, action, result: "failed", employeeName: empName,
            error: tgErr.message ?? "Unknown Telegram error" };
        }
      }
    }

    return NextResponse.json({ success: true, telegramSync });
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
