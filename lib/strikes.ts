import { db } from "./db";

export interface Strike {
  id: string;
  createdAt: string;
  employeeId: string;
  employeeName: string;
  reason: string;
  description: string;
  issuedBy: string;
  date: string;
}

function rowToStrike(r: Record<string, string>): Strike {
  return {
    id:           r.id,
    createdAt:    r.created_at,
    employeeId:   r.employee_id,
    employeeName: r.employee_name,
    reason:       r.reason,
    description:  r.description ?? "",
    issuedBy:     r.issued_by ?? "HR",
    date:         r.date ?? "",
  };
}

export async function createStrike(fields: {
  employeeId: string;
  employeeName: string;
  reason: string;
  description?: string;
  issuedBy?: string;
}): Promise<Strike> {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const { data, error } = await db
    .from("strikes")
    .insert({
      employee_id:   fields.employeeId,
      employee_name: fields.employeeName,
      reason:        fields.reason,
      description:   fields.description ?? "",
      issued_by:     fields.issuedBy ?? "HR",
      date:          today,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToStrike(data);
}

export async function getEmployeeStrikes(employeeId: string): Promise<Strike[]> {
  const { data, error } = await db
    .from("strikes")
    .select("*")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToStrike);
}

export async function getAllStrikeCounts(): Promise<Record<string, number>> {
  const { data, error } = await db
    .from("strikes")
    .select("employee_id");
  if (error) throw new Error(error.message);
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.employee_id] = (counts[row.employee_id] ?? 0) + 1;
  }
  return counts;
}
