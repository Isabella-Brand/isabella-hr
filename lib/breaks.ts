import { db } from "./db";

export interface BreakRecord {
  id: string;
  attendanceId: string;
  name: string;
  breakStart: string;
  breakEnd?: string;
  durationMinutes?: number;
  status: "On Break" | "Returned";
}

function rowToBreak(r: Record<string, any>): BreakRecord {
  return {
    id:              r.id,
    attendanceId:    r.attendance_id,
    name:            r.name,
    breakStart:      r.break_start,
    breakEnd:        r.break_end ?? undefined,
    durationMinutes: r.duration_minutes ?? undefined,
    status:          r.status as "On Break" | "Returned",
  };
}

export async function startBreak(name: string, attendanceId: string): Promise<BreakRecord> {
  const { data, error } = await db
    .from("breaks")
    .insert({ name, attendance_id: attendanceId, break_start: new Date().toISOString(), status: "On Break" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToBreak(data);
}

export async function endBreak(breakId: string, breakStart: string): Promise<BreakRecord> {
  const now = new Date();
  const durationMinutes = parseFloat(
    ((now.getTime() - new Date(breakStart).getTime()) / 60000).toFixed(1)
  );
  const { data, error } = await db
    .from("breaks")
    .update({ break_end: now.toISOString(), duration_minutes: durationMinutes, status: "Returned" })
    .eq("id", breakId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToBreak(data);
}

export async function getOpenBreak(name: string): Promise<BreakRecord | null> {
  const { data, error } = await db
    .from("breaks")
    .select("*")
    .eq("name", name)
    .eq("status", "On Break")
    .order("break_start", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return rowToBreak(data);
}

export async function getAllCurrentBreaks(): Promise<BreakRecord[]> {
  const { data, error } = await db
    .from("breaks")
    .select("*")
    .eq("status", "On Break")
    .order("break_start", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToBreak);
}
