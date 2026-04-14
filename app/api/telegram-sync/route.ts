import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllEmployees } from "@/lib/employees";
import { createInviteLink } from "@/lib/telegram";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const all = await getAllEmployees();

    const eligible = all.filter((e) => e.status === "Active" && e.role);
    const skipped  = all.filter((e) => e.status === "Active" && e.role && !e.telegramUserId);

    const results: { name: string; status: "invite_created" | "failed"; inviteLink?: string; error?: string }[] = [];

    for (const emp of eligible) {
      const name = `${emp.firstName} ${emp.lastName}`.trim();
      try {
        const inviteLink = await createInviteLink(name);
        results.push({ name, status: "invite_created", inviteLink });
      } catch (err: any) {
        results.push({ name, status: "failed", error: err.message });
      }
    }

    return NextResponse.json({
      created:  results.filter((r) => r.status === "invite_created").length,
      failed:   results.filter((r) => r.status === "failed").length,
      skipped:  skipped.length,
      results,
      skippedNames: skipped.map((e) => `${e.firstName} ${e.lastName}`.trim()),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
