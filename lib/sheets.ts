import { db } from "./db";
import type { Shift } from "./roster";

export interface AttendanceRecord {
  id: string;
  name: string;
  shift: Shift;
  clockIn: string;
  clockOut?: string;
  hoursWorked?: number;
  date: string;
}

function toESTDateString(date: Date): string {
  return new Date(date.toLocaleString("en-US", { timeZone: "America/New_York" }))
    .toISOString()
    .split("T")[0];
}

export async function clockIn(name: string, shift: Shift): Promise<AttendanceRecord> {
  const now = new Date();
  const { data, error } = await db
    .from("attendance")
    .insert({
      name,
      shift,
      date:     toESTDateString(now),
      clock_in: now.toISOString(),
      status:   "Clocked In",
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return {
    id:       data.id,
    name:     data.name,
    shift:    data.shift as Shift,
    clockIn:  data.clock_in,
    date:     data.date,
  };
}

export async function clockOut(recordId: string, clockInISO: string): Promise<AttendanceRecord> {
  const now = new Date();
  const hoursWorked = parseFloat(
    ((now.getTime() - new Date(clockInISO).getTime()) / 3600000).toFixed(2)
  );
  const { data, error } = await db
    .from("attendance")
    .update({
      clock_out:    now.toISOString(),
      hours_worked: hoursWorked,
      status:       "Clocked Out",
    })
    .eq("id", recordId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return {
    id:          data.id,
    name:        data.name,
    shift:       data.shift as Shift,
    clockIn:     data.clock_in,
    clockOut:    data.clock_out,
    hoursWorked: data.hours_worked,
    date:        data.date,
  };
}

export async function getOpenClockIn(name: string): Promise<AttendanceRecord | null> {
  const today = toESTDateString(new Date());
  const { data, error } = await db
    .from("attendance")
    .select("*")
    .eq("name", name)
    .eq("date", today)
    .eq("status", "Clocked In")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    id:      data.id,
    name:    data.name,
    shift:   data.shift as Shift,
    clockIn: data.clock_in,
    date:    data.date,
  };
}

export async function getAllClockedIn(): Promise<AttendanceRecord[]> {
  const { data, error } = await db
    .from("attendance")
    .select("*")
    .eq("status", "Clocked In");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id:      r.id,
    name:    r.name,
    shift:   r.shift as Shift,
    clockIn: r.clock_in,
    date:    r.date,
  }));
}

export async function getTodayAttendance(): Promise<AttendanceRecord[]> {
  const today = toESTDateString(new Date());
  const { data, error } = await db
    .from("attendance")
    .select("*")
    .eq("date", today)
    .order("clock_in", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id:          r.id,
    name:        r.name,
    shift:       r.shift as Shift,
    clockIn:     r.clock_in,
    clockOut:    r.clock_out ?? undefined,
    hoursWorked: r.hours_worked ?? undefined,
    date:        r.date,
  }));
}
