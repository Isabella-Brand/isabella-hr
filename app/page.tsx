"use client";

import { useState, useEffect } from "react";
import type { AttendanceRecord } from "@/lib/sheets";

type ActiveEmployee = { name: string; email: string };
type AppState = "idle" | "loading" | "clocked-in" | "clocked-out" | "error";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
  });
}

function formatDuration(clockInISO: string) {
  const diff = Date.now() - new Date(clockInISO).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function ClockPage() {
  const [selectedName, setSelectedName] = useState("");
  const [state, setState] = useState<AppState>("idle");
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [elapsed, setElapsed] = useState("");
  const [checking, setChecking] = useState(false);
  const [activeEmployees, setActiveEmployees] = useState<ActiveEmployee[]>([]);

  useEffect(() => {
    fetch("/api/active-employees")
      .then((r) => r.json())
      .then((data) => { if (data.employees) setActiveEmployees(data.employees); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (state !== "clocked-in" || !record) return;
    const tick = () => setElapsed(formatDuration(record.clockIn));
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, [state, record]);

  useEffect(() => {
    if (!selectedName) {
      setState("idle");
      setRecord(null);
      return;
    }
    setChecking(true);
    fetch(`/api/status?name=${encodeURIComponent(selectedName)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.clockedIn) {
          setState("clocked-in");
          setRecord(data.record);
        } else {
          setState("idle");
          setRecord(null);
        }
      })
      .catch(() => setState("idle"))
      .finally(() => setChecking(false));
  }, [selectedName]);

  async function handleClockIn() {
    setState("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/clock-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selectedName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Clock-in failed");
      setState("clocked-in");
      setRecord(data.record);
    } catch (err: unknown) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function handleClockOut() {
    setState("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/clock-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selectedName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Clock-out failed");
      setState("clocked-out");
      setRecord(data.record);
    } catch (err: unknown) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">Isabella</h1>
          <p className="text-gray-400 text-sm mt-1">Attendance</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 rounded-2xl shadow-xl p-6 space-y-5">
          {/* Name selector */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
              Select Your Name
            </label>
            <select
              value={selectedName}
              onChange={(e) => setSelectedName(e.target.value)}
              disabled={state === "loading" || state === "clocked-in"}
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">— Choose name —</option>
              {activeEmployees.map((e) => (
                <option key={e.email} value={e.name}>{e.name}</option>
              ))}
            </select>
          </div>

          {/* Spinner while checking status */}
          {checking && (
            <div className="text-center py-2">
              <div className="inline-block w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Clocked-in status */}
          {state === "clocked-in" && record && (
            <div className="rounded-xl px-4 py-3 bg-indigo-950 border border-indigo-700">
              <p className="text-xs font-medium text-indigo-400 mb-1">Currently clocked in</p>
              <p className="text-lg font-bold text-indigo-300">{elapsed || formatDuration(record.clockIn)}</p>
              <p className="text-xs text-indigo-400 opacity-70 mt-0.5">
                Since {formatTime(record.clockIn)} EST
              </p>
            </div>
          )}

          {/* Clocked-out confirmation */}
          {state === "clocked-out" && record && (
            <div className="rounded-xl px-4 py-3 bg-green-950 border border-green-700">
              <p className="text-xs font-medium text-green-400 mb-1">Clocked out successfully</p>
              <p className="text-lg font-bold text-green-300">{record.hoursWorked}h worked</p>
              <p className="text-xs text-green-400 opacity-70 mt-0.5">
                {formatTime(record.clockIn)} &rarr; {formatTime(record.clockOut!)} EST
              </p>
            </div>
          )}

          {/* Error */}
          {state === "error" && (
            <div className="rounded-xl px-4 py-3 bg-red-950 border border-red-700">
              <p className="text-xs font-medium text-red-400">{errorMsg}</p>
            </div>
          )}

          {/* Action button */}
          {selectedName && !checking && state !== "clocked-out" && (
            <button
              onClick={state === "clocked-in" ? handleClockOut : handleClockIn}
              disabled={state === "loading"}
              className={`w-full py-4 rounded-xl text-base font-bold tracking-wide transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed
                ${state === "clocked-in"
                  ? "bg-red-600 hover:bg-red-500 text-white"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white"
                }`}
            >
              {state === "loading"
                ? "Please wait..."
                : state === "clocked-in"
                ? "Stop  Clock Out"
                : "Play  Clock In"}
            </button>
          )}

          {state === "clocked-out" && (
            <button
              onClick={() => { setSelectedName(""); setState("idle"); setRecord(null); }}
              className="w-full py-4 rounded-xl text-base font-bold bg-gray-800 hover:bg-gray-700 text-white transition-all active:scale-95"
            >
              Done
            </button>
          )}
        </div>

        {/* Links */}
        <div className="text-center mt-6 flex justify-center gap-6">
          <a href="/dashboard" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Manager Dashboard &rarr;
          </a>
          <a href="/admin" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            HR Portal &rarr;
          </a>
        </div>
      </div>
    </main>
  );
}
