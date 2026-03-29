import { NextRequest, NextResponse } from "next/server";
import { getOpenClockIn } from "@/lib/sheets";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");

    if (!name) {
      return NextResponse.json({ error: "name query param required" }, { status: 400 });
    }

    const record = await getOpenClockIn(name);
    return NextResponse.json({ clockedIn: !!record, record: record ?? null });
  } catch (err: any) {
    console.error("status error:", err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
