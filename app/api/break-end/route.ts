import { NextRequest, NextResponse } from "next/server";
import { endBreak, getOpenBreak } from "@/lib/breaks";

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

    const existing = await getOpenBreak(name);
    if (!existing) return NextResponse.json({ error: "Not on break" }, { status: 404 });

    const record = await endBreak(existing.id, existing.breakStart);
    return NextResponse.json({ success: true, record });
  } catch (err: any) {
    console.error("break-end error:", err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
