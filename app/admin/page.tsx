"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { Employee, EmployeeStatus, EmployeeRole, EmployeeShift } from "@/lib/employees";

// ── Send Form Modal ───────────────────────────────────────────────

function SendFormModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/send-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      setStatus("success");
    } catch (err: any) {
      setErrMsg(err.message);
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-white font-bold text-lg">Send Onboarding Form</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        {status === "success" ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-green-400 font-semibold">Form sent successfully!</p>
            <p className="text-gray-400 text-sm mt-1">{email}</p>
            <button onClick={onClose} className="mt-5 w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold transition-all">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                New Hire Name (optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John"
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="newhire@email.com"
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {status === "error" && (
              <div className="rounded-xl px-4 py-3 bg-red-950 border border-red-700">
                <p className="text-xs text-red-400">{errMsg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all disabled:opacity-60"
            >
              {status === "loading" ? "Sending..." : "Send Form"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Add Employee Modal ────────────────────────────────────────────

function AddEmployeeModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "",
    country: "", startDate: "", telegramHandle: "", crmName: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add employee");
      setStatus("success");
      setTimeout(() => { onAdded(); onClose(); }, 1000);
    } catch (err: any) {
      setErrMsg(err.message);
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-white font-bold text-lg">Add Employee Manually</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        {status === "success" ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-green-400 font-semibold">Employee added!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">First Name *</label>
                <input type="text" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Last Name *</label>
                <input type="text" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} required
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Personal Email *</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Country</label>
              <input type="text" value={form.country} onChange={(e) => set("country", e.target.value)}
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Start Date</label>
              <input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)}
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Telegram Handle</label>
              <input type="text" value={form.telegramHandle} onChange={(e) => set("telegramHandle", e.target.value)} placeholder="@username"
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">CRM Name</label>
              <input type="text" value={form.crmName} onChange={(e) => set("crmName", e.target.value)} placeholder="Name in CRM..."
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            {status === "error" && (
              <div className="rounded-xl px-4 py-3 bg-red-950 border border-red-700">
                <p className="text-xs text-red-400">{errMsg}</p>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold transition-all">
                Cancel
              </button>
              <button type="submit" disabled={status === "loading"}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all disabled:opacity-60">
                {status === "loading" ? "Adding..." : "Add Employee"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Edit Employee Modal ───────────────────────────────────────────

function EditEmployeeModal({ employee, onClose, onSaved }: { employee: Employee; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    firstName:      employee.firstName,
    lastName:       employee.lastName,
    email:          employee.email,
    country:        employee.country,
    startDate:      employee.startDate,
    telegramHandle: employee.telegramHandle,
    crmName:        employee.crmName,
    gustoAcc:       employee.gustoAcc,
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: employee.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setStatus("success");
      setTimeout(() => { onSaved(); onClose(); }, 800);
    } catch (err: any) {
      setErrMsg(err.message);
      setStatus("error");
    }
  }

  const fullName = `${employee.firstName} ${employee.lastName}`.trim();

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-white font-bold text-lg">Edit Employee</h2>
            <p className="text-gray-400 text-xs mt-0.5">{fullName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        {status === "success" ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-green-400 font-semibold">Saved!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">First Name *</label>
                <input type="text" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Last Name *</label>
                <input type="text" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} required
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Email *</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Country</label>
              <input type="text" value={form.country} onChange={(e) => set("country", e.target.value)}
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Start Date</label>
              <input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)}
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Telegram Handle</label>
              <input type="text" value={form.telegramHandle} onChange={(e) => set("telegramHandle", e.target.value)} placeholder="@username"
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">CRM Name</label>
              <input type="text" value={form.crmName} onChange={(e) => set("crmName", e.target.value)} placeholder="Name in CRM..."
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Gusto Acc</label>
              <input type="text" value={form.gustoAcc} onChange={(e) => set("gustoAcc", e.target.value)} placeholder="Gusto ID..."
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            {status === "error" && (
              <div className="rounded-xl px-4 py-3 bg-red-950 border border-red-700">
                <p className="text-xs text-red-400">{errMsg}</p>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold transition-all">
                Cancel
              </button>
              <button type="submit" disabled={status === "loading"}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all disabled:opacity-60">
                {status === "loading" ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Employee Row ──────────────────────────────────────────────────

function EmployeeRow({
  employee,
  onUpdate,
  onEdit,
  onDelete,
}: {
  employee: Employee;
  onUpdate: (id: string, fields: { status?: EmployeeStatus; gustoAcc?: string; crmName?: string; deactivatedDate?: string; role?: EmployeeRole; shiftAssigned?: EmployeeShift }) => Promise<void>;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}) {
  const [status, setStatus] = useState<EmployeeStatus>(employee.status);
  const [gusto, setGusto] = useState(employee.gustoAcc);
  const [crmName, setCrmName] = useState(employee.crmName);
  const [deactivatedDate, setDeactivatedDate] = useState(employee.deactivatedDate);
  const [role, setRole] = useState<EmployeeRole>(employee.role);
  const [shiftAssigned, setShiftAssigned] = useState<EmployeeShift>(employee.shiftAssigned);
  const [saving, setSaving] = useState(false);

  const shiftRoles: EmployeeRole[] = ["QA Lead", "Chatter"];

  async function handleStatusChange(val: EmployeeStatus) {
    setStatus(val);
    setSaving(true);
    const newDate = val === "Deactivated" ? new Date().toISOString().split("T")[0] : "";
    setDeactivatedDate(newDate);
    await onUpdate(employee.id, { status: val, deactivatedDate: newDate });
    setSaving(false);
  }

  async function handleGustoBlur() {
    if (gusto === employee.gustoAcc) return;
    setSaving(true);
    await onUpdate(employee.id, { gustoAcc: gusto });
    setSaving(false);
  }

  async function handleCrmNameBlur() {
    if (crmName === employee.crmName) return;
    setSaving(true);
    await onUpdate(employee.id, { crmName });
    setSaving(false);
  }

  async function handleDateChange(val: string) {
    setDeactivatedDate(val);
    setSaving(true);
    await onUpdate(employee.id, { deactivatedDate: val });
    setSaving(false);
  }

  async function handleRoleChange(val: EmployeeRole) {
    setRole(val);
    setSaving(true);
    const newShift = shiftRoles.includes(val) ? shiftAssigned : "";
    setShiftAssigned(newShift);
    await onUpdate(employee.id, { role: val, shiftAssigned: newShift });
    setSaving(false);
  }

  async function handleShiftChange(val: EmployeeShift) {
    setShiftAssigned(val);
    setSaving(true);
    await onUpdate(employee.id, { shiftAssigned: val });
    setSaving(false);
  }

  const fullName = `${employee.firstName} ${employee.lastName}`.trim();

  return (
    <tr className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors">
      <td className="px-4 py-3">
        <div className="text-white font-medium text-sm">{fullName || "—"}</div>
        <div className="text-gray-400 text-xs mt-0.5">{employee.email}</div>
      </td>
      <td className="px-4 py-3 text-gray-300 text-sm">{employee.telegramHandle || "—"}</td>
      <td className="px-4 py-3 text-gray-300 text-sm">{employee.country || "—"}</td>
      <td className="px-4 py-3 text-gray-300 text-sm">{employee.startDate || "—"}</td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1.5">
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as EmployeeStatus)}
            disabled={saving}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer
              ${status === "Active"
                ? "bg-green-950 border-green-700 text-green-300"
                : status === "Deactivated"
                ? "bg-red-950 border-red-800 text-red-400"
                : "bg-gray-800 border-gray-600 text-gray-300"
              }`}
          >
            <option value="">— Set Status —</option>
            <option value="Active">Active</option>
            <option value="Deactivated">Deactivated</option>
          </select>
          {status === "Deactivated" && (
            <input
              type="date"
              value={deactivatedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              disabled={saving}
              className="bg-gray-800 text-red-300 text-xs rounded-lg px-2 py-1 border border-red-900 focus:outline-none focus:ring-2 focus:ring-red-700 disabled:opacity-50"
            />
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <select
          value={role}
          onChange={(e) => handleRoleChange(e.target.value as EmployeeRole)}
          disabled={saving}
          className="bg-gray-800 text-white text-xs rounded-lg px-3 py-1.5 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
        >
          <option value="">— Role —</option>
          <option value="QA Lead">QA Lead</option>
          <option value="Chatter">Chatter</option>
          <option value="Management">Management</option>
          <option value="Executive Assistant">Executive Assistant</option>
          <option value="Shipping">Shipping</option>
          <option value="Graphics">Graphics</option>
        </select>
      </td>
      <td className="px-4 py-3">
        {shiftRoles.includes(role) ? (
          <select
            value={shiftAssigned}
            onChange={(e) => handleShiftChange(e.target.value as EmployeeShift)}
            disabled={saving}
            className="bg-gray-800 text-white text-xs rounded-lg px-3 py-1.5 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
          >
            <option value="">— Shift —</option>
            <option value="Morning">Morning</option>
            <option value="Afternoon">Afternoon</option>
            <option value="Graveyard">Graveyard</option>
          </select>
        ) : (
          <span className="text-gray-600 text-xs">N/A</span>
        )}
      </td>
      <td className="px-4 py-3">
        <input
          type="text"
          value={gusto}
          onChange={(e) => setGusto(e.target.value)}
          onBlur={handleGustoBlur}
          disabled={saving}
          placeholder="Gusto ID..."
          className="bg-gray-800 text-white text-xs rounded-lg px-3 py-1.5 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-36 disabled:opacity-50"
        />
      </td>
      <td className="px-4 py-3">
        <input
          type="text"
          value={crmName}
          onChange={(e) => setCrmName(e.target.value)}
          onBlur={handleCrmNameBlur}
          disabled={saving}
          placeholder="Name in CRM..."
          className="bg-gray-800 text-white text-xs rounded-lg px-3 py-1.5 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-36 disabled:opacity-50"
        />
      </td>
      <td className="px-4 py-3 text-center">
        {saving ? (
          <span className="text-xs text-indigo-400 animate-pulse">saving…</span>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => onEdit(employee)}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors px-2 py-1 rounded hover:bg-gray-700"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(employee)}
              className="text-xs text-red-500 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-gray-700"
            >
              Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────────

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [filterRole, setFilterRole] = useState("");
  const [filterShift, setFilterShift] = useState("");
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/admin/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") fetchEmployees();
  }, [status]);

  async function fetchEmployees() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/employees");
      if (!res.ok) throw new Error("Failed to load employees");
      const data = await res.json();
      setEmployees(data.employees);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(id: string, fields: { status?: EmployeeStatus; gustoAcc?: string; crmName?: string; deactivatedDate?: string; role?: EmployeeRole; shiftAssigned?: EmployeeShift }) {
    await fetch("/api/employees", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...fields }),
    });
    setEmployees((prev) =>
      prev.map((e) => e.id === id ? { ...e, ...fields } : e)
    );
  }

  async function handleDelete(employee: Employee) {
    setDeleteLoading(true);
    await fetch("/api/employees", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: employee.id }),
    });
    setEmployees((prev) => prev.filter((e) => e.id !== employee.id));
    setDeletingEmployee(null);
    setDeleteLoading(false);
  }

  if (status === "loading" || status === "unauthenticated") {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const activeEmployees = employees.filter((e) => e.status !== "Deactivated");
  const archivedEmployees = employees.filter((e) => e.status === "Deactivated");

  const filteredActiveEmployees = activeEmployees.filter((e) => {
    if (filterRole  && e.role          !== filterRole)  return false;
    if (filterShift && e.shiftAssigned !== filterShift) return false;
    return true;
  });

  function exportEmployeesCSV() {
    const headers = ["First Name","Last Name","Email","Country","Start Date","Telegram","Role","Shift","Gusto Acc","CRM Name","Status"];
    const rows = filteredActiveEmployees.map((e) => [
      e.firstName, e.lastName, e.email, e.country, e.startDate,
      e.telegramHandle, e.role, e.shiftAssigned, e.gustoAcc, e.crmName, e.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `active-employees${filterRole ? `-${filterRole}` : ""}${filterShift ? `-${filterShift}` : ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const tableHeaders = (
    <thead>
      <tr className="border-b border-gray-700">
        {["Employee","Telegram","Country","Start Date","Status / Date","Role","Shift","Gusto Acc","CRM Name",""].map((h) => (
          <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
        ))}
      </tr>
    </thead>
  );

  return (
    <main className="min-h-screen bg-gray-950 p-4 md:p-8">
      {showModal && <SendFormModal onClose={() => { setShowModal(false); fetchEmployees(); }} />}
      {showAddModal && <AddEmployeeModal onClose={() => setShowAddModal(false)} onAdded={fetchEmployees} />}
      {editingEmployee && (
        <EditEmployeeModal
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onSaved={fetchEmployees}
        />
      )}
      {deletingEmployee && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-white font-bold text-lg mb-2">Delete Employee?</h2>
            <p className="text-gray-400 text-sm mb-6">
              This will permanently remove <span className="text-white font-semibold">{deletingEmployee.firstName} {deletingEmployee.lastName}</span> and all their data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingEmployee(null)}
                className="flex-1 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingEmployee)}
                disabled={deleteLoading}
                className="flex-1 py-3 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold transition-all disabled:opacity-60"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Employee Management</h1>
            <p className="text-gray-400 text-sm mt-1">Isabella — HR Portal</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-all"
            >
              + Add Manually
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all"
            >
              + Send Onboarding Form
            </button>
            <button
              onClick={() => fetchEmployees()}
              className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold transition-all"
            >
              Refresh
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 rounded-2xl p-5">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Employees</p>
            <p className="text-3xl font-bold text-white">{employees.length}</p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-5">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Active</p>
            <p className="text-3xl font-bold text-green-400">{activeEmployees.length}</p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-5">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Deactivated</p>
            <p className="text-3xl font-bold text-red-400">{archivedEmployees.length}</p>
          </div>
        </div>

        {/* Shift Breakdown */}
        {!loading && activeEmployees.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {(["Morning", "Afternoon", "Graveyard"] as const).map((shift) => {
              const chatters = activeEmployees.filter((e) => e.shiftAssigned === shift && e.role === "Chatter").length;
              const qaLeads  = activeEmployees.filter((e) => e.shiftAssigned === shift && e.role === "QA Lead").length;
              const total    = chatters + qaLeads;
              const colors: Record<string, { border: string; label: string; dot: string }> = {
                Morning:   { border: "border-amber-700",  label: "text-amber-400",  dot: "bg-amber-400" },
                Afternoon: { border: "border-blue-700",   label: "text-blue-400",   dot: "bg-blue-400"  },
                Graveyard: { border: "border-indigo-700", label: "text-indigo-400", dot: "bg-indigo-400" },
              };
              const c = colors[shift];
              return (
                <div key={shift} className={`bg-gray-900 rounded-2xl p-5 border ${c.border}`}>
                  <p className={`text-xs uppercase tracking-wider font-semibold mb-3 ${c.label}`}>{shift}</p>
                  <p className="text-2xl font-bold text-white mb-3">{total} <span className="text-sm font-normal text-gray-400">active</span></p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400 flex items-center gap-1.5">
                        <span className={`inline-block w-2 h-2 rounded-full ${c.dot}`} />
                        Chatters
                      </span>
                      <span className="font-semibold text-white">{chatters}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400 flex items-center gap-1.5">
                        <span className={`inline-block w-2 h-2 rounded-full ${c.dot} opacity-50`} />
                        QA Leads
                      </span>
                      <span className="font-semibold text-white">{qaLeads}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl px-4 py-3 bg-red-950 border border-red-700">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Active Employees Table */}
        <div className="bg-gray-900 rounded-2xl overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold">Active Employees</h2>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">
                  {filteredActiveEmployees.length}{filteredActiveEmployees.length !== activeEmployees.length ? ` of ${activeEmployees.length}` : ""} people
                </span>
                <button
                  onClick={exportEmployeesCSV}
                  className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-semibold transition-all"
                >
                  Export CSV
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="bg-gray-800 text-white text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="">All Roles</option>
                <option value="QA Lead">QA Lead</option>
                <option value="Chatter">Chatter</option>
                <option value="Management">Management</option>
                <option value="Executive Assistant">Executive Assistant</option>
                <option value="Shipping">Shipping</option>
                <option value="Graphics">Graphics</option>
              </select>
              <select
                value={filterShift}
                onChange={(e) => setFilterShift(e.target.value)}
                className="bg-gray-800 text-white text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="">All Shifts</option>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Graveyard">Graveyard</option>
              </select>
              {(filterRole || filterShift) && (
                <button
                  onClick={() => { setFilterRole(""); setFilterShift(""); }}
                  className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs transition-all"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeEmployees.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              No active employees yet. Send the onboarding form to get started.
            </div>
          ) : filteredActiveEmployees.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-sm">
              No employees match the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                {tableHeaders}
                <tbody>
                  {filteredActiveEmployees.map((emp) => (
                    <EmployeeRow key={emp.id} employee={emp} onUpdate={handleUpdate} onEdit={setEditingEmployee} onDelete={setDeletingEmployee} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Archived / Deactivated */}
        {archivedEmployees.length > 0 && (
          <div className="bg-gray-900 rounded-2xl overflow-hidden opacity-70">
            <button
              onClick={() => setShowArchived((v) => !v)}
              className="w-full px-6 py-4 border-b border-gray-800 flex items-center justify-between hover:bg-gray-800/40 transition-colors"
            >
              <h2 className="text-gray-400 font-semibold">Archived (Deactivated)</h2>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">{archivedEmployees.length} people</span>
                <span className="text-gray-500 text-sm">{showArchived ? "▲" : "▼"}</span>
              </div>
            </button>

            {showArchived && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  {tableHeaders}
                  <tbody>
                    {archivedEmployees.map((emp) => (
                      <EmployeeRow key={emp.id} employee={emp} onUpdate={handleUpdate} onEdit={setEditingEmployee} onDelete={setDeletingEmployee} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="text-center mt-8">
          <a href="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            ← Clock In / Out
          </a>
        </div>
      </div>
    </main>
  );
}
