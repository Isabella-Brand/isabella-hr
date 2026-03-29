import { db } from "./db";

export type EmployeeStatus = "Active" | "Deactivated" | "";
export type EmployeeRole = "QA Lead" | "Chatter" | "Management" | "Executive Assistant" | "Shipping" | "Graphics" | "";
export type EmployeeShift = "Morning" | "Afternoon" | "Graveyard" | "";

export interface Employee {
  id: string;
  createdAt: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  startDate: string;
  telegramHandle: string;
  status: EmployeeStatus;
  gustoAcc: string;
  deactivatedDate: string;
  role: EmployeeRole;
  shiftAssigned: EmployeeShift;
}

function rowToEmployee(r: Record<string, string>): Employee {
  return {
    id:              r.id,
    createdAt:       r.created_at,
    firstName:       r.first_name,
    lastName:        r.last_name,
    email:           r.email,
    country:         r.country ?? "",
    startDate:       r.start_date ?? "",
    telegramHandle:  r.telegram_handle ?? "",
    status:          (r.status ?? "") as EmployeeStatus,
    gustoAcc:        r.gusto_acc ?? "",
    deactivatedDate: r.deactivated_date ?? "",
    role:            (r.role ?? "") as EmployeeRole,
    shiftAssigned:   (r.shift_assigned ?? "") as EmployeeShift,
  };
}

export async function getAllEmployees(): Promise<Employee[]> {
  const { data, error } = await db
    .from("employees")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToEmployee);
}

export async function createEmployee(fields: {
  firstName: string;
  lastName: string;
  email: string;
  country?: string;
  startDate?: string;
  telegramHandle?: string;
}): Promise<Employee> {
  const { data, error } = await db
    .from("employees")
    .insert({
      first_name:       fields.firstName,
      last_name:        fields.lastName,
      email:            fields.email,
      country:          fields.country ?? "",
      start_date:       fields.startDate ?? "",
      telegram_handle:  fields.telegramHandle ?? "",
      status:           "",
      role:             "",
      shift_assigned:   "",
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToEmployee(data);
}

export async function updateEmployee(
  id: string,
  fields: {
    status?: EmployeeStatus;
    gustoAcc?: string;
    deactivatedDate?: string;
    role?: EmployeeRole;
    shiftAssigned?: EmployeeShift;
  }
): Promise<void> {
  const patch: Record<string, string> = {};
  if (fields.status !== undefined)          patch.status           = fields.status;
  if (fields.gustoAcc !== undefined)        patch.gusto_acc        = fields.gustoAcc;
  if (fields.deactivatedDate !== undefined) patch.deactivated_date = fields.deactivatedDate;
  if (fields.role !== undefined)            patch.role             = fields.role;
  if (fields.shiftAssigned !== undefined)   patch.shift_assigned   = fields.shiftAssigned;

  const { error } = await db.from("employees").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getActiveClockInEmployees(): Promise<{ name: string; email: string; shift: string }[]> {
  const { data, error } = await db
    .from("employees")
    .select("first_name, last_name, email, shift_assigned")
    .eq("status", "Active")
    .in("role", ["QA Lead", "Chatter"]);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    name:  `${r.first_name} ${r.last_name}`.trim(),
    email: r.email,
    shift: r.shift_assigned ?? "",
  }));
}
