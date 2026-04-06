import { NextRequest, NextResponse } from "next/server";
import { getOpenBreak } from "@/lib/breaks";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

    const record = await getOpenBreak(name);
    return NextResponse.json({ onBreak: !!record, record: record ?? null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
