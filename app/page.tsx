"use client";

import { useState, useEffect } from "react";
import type { AttendanceRecord } from "@/lib/sheets";
import type { BreakRecord } from "@/lib/breaks";

type ActiveEmployee = { name: string; email: string };
type AppState = "idle" | "loading" | "clocked-in" | "on-break" | "clocked-out" | "error";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/New_York",
  });
}

function formatDuration(isoStart: string) {
  const diff = Date.now() - new Date(isoStart).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function ClockPage() {
  const [selectedName, setSelectedName] = useState("");
  const [state, setState] = useState<AppState>("idle");
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [breakRecord, setBreakRecord] = useState<BreakRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [elapsed, setElapsed] = useState("");
  const [breakElapsed, setBreakElapsed] = useState("");
  const [checking, setChecking] = useState(false);
  const [activeEmployees, setActiveEmployees] = useState<ActiveEmployee[]>([]);

  useEffect(() => {
    fetch("/api/active-employees")
      .then((r) => r.json())
      .then((data) => { if (data.employees) setActiveEmployees(data.employees); })
      .catch(() => {});
  }, []);

  // Clock-in elapsed timer
  useEffect(() => {
    if ((state !== "clocked-in" && state !== "on-break") || !record) return;
    const tick = () => setElapsed(formatDuration(record.clockIn));
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, [state, record]);

  // Break elapsed timer
  useEffect(() => {
    if (state !== "on-break" || !breakRecord) return;
    const tick = () => setBreakElapsed(formatDuration(breakRecord.breakStart));
    tick();
    const t = setInterval(tick, 10_000);
    return () => clearInterval(t);
  }, [state, breakRecord]);

  // When name changes, check clock-in + break status
  useEffect(() => {
    if (!selectedName) { setState("idle"); setRecord(null); setBreakRecord(null); return; }
    setChecking(true);
    Promise.all([
      fetch(`/api/status?name=${encodeURIComponent(selectedName)}`).then((r) => r.json()),
      fetch(`/api/break-status?name=${encodeURIComponent(selectedName)}`).then((r) => r.json()),
    ])
      .then(([statusData, breakData]) => {
        if (statusData.clockedIn) {
          setRecord(statusData.record);
          if (breakData.onBreak) {
            setState("on-break");
            setBreakRecord(breakData.record);
          } else {
            setState("clocked-in");
            setBreakRecord(null);
          }
        } else {
          setState("idle");
          setRecord(null);
          setBreakRecord(null);
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
        method: "POST", headers: { "Content-Type": "application/json" },
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
      // End any open break first
      if (breakRecord) {
        await fetch("/api/break-end", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: selectedName }),
        });
      }
      const res = await fetch("/api/clock-out", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selectedName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Clock-out failed");
      setState("clocked-out");
      setRecord(data.record);
      setBreakRecord(null);
    } catch (err: unknown) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function handleStartBreak() {
    setState("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/break-start", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selectedName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start break");
      setState("on-break");
      setBreakRecord(data.record);
    } catch (err: unknown) {
      setState("clocked-in");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function handleEndBreak() {
    setState("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/break-end", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selectedName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to end break");
      setState("clocked-in");
      setBreakRecord(null);
    } catch (err: unknown) {
      setState("on-break");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  const isActive = state === "clocked-in" || state === "on-break";

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">Isabella</h1>
          <p className="text-gray-400 text-sm mt-1">Attendance</p>
        </div>

        <div className="bg-gray-900 rounded-2xl shadow-xl p-6 space-y-5">
          {/* Name selector */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
              Select Your Name
            </label>
            <select
              value={selectedName}
              onChange={(e) => setSelectedName(e.target.value)}
              disabled={state === "loading" || isActive}
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">— Choose name —</option>
              {activeEmployees.map((e) => (
                <option key={e.email} value={e.name}>{e.name}</option>
              ))}
            </select>
          </div>

          {/* Spinner */}
          {checking && (
            <div className="text-center py-2">
              <div className="inline-block w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Clocked-in status */}
          {isActive && record && (
            <div className="rounded-xl px-4 py-3 bg-indigo-950 border border-indigo-700">
              <p className="text-xs font-medium text-indigo-400 mb-1">Clocked in</p>
              <p className="text-lg font-bold text-indigo-300">{elapsed || formatDuration(record.clockIn)}</p>
              <p className="text-xs text-indigo-400 opacity-70 mt-0.5">Since {formatTime(record.clockIn)} EST</p>
            </div>
          )}

          {/* On break status */}
          {state === "on-break" && breakRecord && (
            <div className="rounded-xl px-4 py-3 bg-amber-950 border border-amber-700">
              <p className="text-xs font-medium text-amber-400 mb-1">On break</p>
              <p className="text-lg font-bold text-amber-300">{breakElapsed || formatDuration(breakRecord.breakStart)}</p>
              <p className="text-xs text-amber-400 opacity-70 mt-0.5">Since {formatTime(breakRecord.breakStart)} EST</p>
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

          {/* Buttons */}
          {selectedName && !checking && state !== "clocked-out" && (
            <div className="space-y-3">
              {/* Break button */}
              {state === "clocked-in" && (
                <button
                  onClick={handleStartBreak}
                  disabled={state !== "clocked-in"}
                  className="w-full py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all active:scale-95 bg-amber-600 hover:bg-amber-500 text-white"
                >
                  Start Break
                </button>
              )}
              {state === "on-break" && (
                <button
                  onClick={handleEndBreak}
                  className="w-full py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all active:scale-95 bg-green-600 hover:bg-green-500 text-white"
                >
                  End Break
                </button>
              )}

              {/* Clock In / Clock Out */}
              <button
                onClick={isActive ? handleClockOut : handleClockIn}
                disabled={state === "loading"}
                className={`w-full py-4 rounded-xl text-base font-bold tracking-wide transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed
                  ${isActive ? "bg-red-600 hover:bg-red-500 text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white"}`}
              >
                {state === "loading" ? "Please wait..." : isActive ? "Stop  Clock Out" : "Play  Clock In"}
              </button>
            </div>
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
