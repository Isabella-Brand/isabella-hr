"use client";

import { useState, useEffect, useCallback } from "react";
import {
  SHIFT_COLORS,
  SHIFT_EMOJI,
  SHIFT_HOURS,
  type Shift,
} from "@/lib/roster";
import type { AttendanceRecord } from "@/lib/sheets";
import type { BreakRecord } from "@/lib/breaks";

interface DashboardData {
  active: AttendanceRecord[];
  today: AttendanceRecord[];
  breaks: BreakRecord[];
}

interface PersonTotal {
  name: string;
  shift: string;
  sessions: number;
  hours: number;
}

interface HistoryData {
  records: AttendanceRecord[];
  totals: PersonTotal[];
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
  });
}

function formatDuration(clockInISO: string, clockOutISO?: string) {
  const end = clockOutISO ? new Date(clockOutISO).getTime() : Date.now();
  const diff = end - new Date(clockInISO).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function hourLabel(h: number) {
  if (h === 0)  return "12 AM";
  if (h < 12)   return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

function toDateInputValue(d: Date) {
  return d.toLocaleDateString("en-CA", { timeZone: "America/New_York" }); // YYYY-MM-DD
}

function exportCSV(records: AttendanceRecord[]) {
  const headers = ["Name", "Shift", "Date (EST)", "Clock In (EST)", "Clock Out (EST)", "Hours Worked"];
  const rows = records.map((r) => [
    r.name,
    r.shift,
    r.date,
    formatTime(r.clockIn),
    r.clockOut ? formatTime(r.clockOut) : "",
    r.hoursWorked ?? "",
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((v) => `"${v}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `attendance-export.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const SHIFTS: Shift[] = ["Morning", "Afternoon", "Graveyard"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // History state
  const today     = toDateInputValue(new Date());
  const weekAgo   = toDateInputValue(new Date(Date.now() - 6 * 86400000));
  const [startDate,  setStartDate]  = useState(weekAgo);
  const [endDate,    setEndDate]    = useState(today);
  const [startHour,  setStartHour]  = useState<string>("");
  const [endHour,    setEndHour]    = useState<string>("");
  const [historyData,    setHistoryData]    = useState<HistoryData | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError,   setHistoryError]   = useState("");
  const [showRawRecords, setShowRawRecords] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastRefresh(new Date());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 60_000);
    return () => clearInterval(t);
  }, [fetchData]);

  async function loadHistory() {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const params = new URLSearchParams({ startDate, endDate });
      if (startHour !== "") params.set("startHour", startHour);
      if (endHour   !== "") params.set("endHour",   endHour);
      const res  = await fetch(`/api/history?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      setHistoryData(json);
      setShowRawRecords(false);
    } catch (err: any) {
      setHistoryError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  }

  const activeByShift = (shift: Shift) =>
    data?.active.filter((r) => r.shift === shift) ?? [];

  const todayByShift = (shift: Shift) =>
    data?.today.filter((r) => r.shift === shift) ?? [];

  const totalHoursToday = data?.today
    .filter((r) => r.hoursWorked)
    .reduce((sum, r) => sum + (r.hoursWorked ?? 0), 0)
    .toFixed(1);

  return (
    <main className="min-h-screen bg-gray-950 p-4 pb-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-2">
          <div>
            <h1 className="text-xl font-bold text-white">Manager Dashboard</h1>
            <p className="text-gray-500 text-xs mt-0.5">
              Auto-refreshes every 60s &middot; Last:{" "}
              {lastRefresh.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
          </div>
          <button
            onClick={() => { setLoading(true); fetchData(); }}
            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>

        {loading && (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && data && (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-gray-900 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{data.active.length}</p>
                <p className="text-xs text-gray-400 mt-1">Clocked In</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">
                  {data.today.filter((r) => r.clockOut).length}
                </p>
                <p className="text-xs text-gray-400 mt-1">Completed</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{totalHoursToday ?? "0"}</p>
                <p className="text-xs text-gray-400 mt-1">Hours Today</p>
              </div>
            </div>

            {/* On Break */}
            {data.breaks.length > 0 && (
              <>
                <h2 className="text-sm font-semibold text-amber-500 uppercase tracking-wider mb-3">
                  On Break &mdash; {data.breaks.length} {data.breaks.length === 1 ? "person" : "people"}
                </h2>
                <div className="mb-6 rounded-xl overflow-hidden border border-amber-700">
                  <div className="bg-amber-950 px-4 py-2 text-xs font-semibold text-amber-400">
                    Currently on break
                  </div>
                  <div className="bg-gray-900 divide-y divide-gray-800">
                    {data.breaks.map((b) => {
                      const diff = Date.now() - new Date(b.breakStart).getTime();
                      const h = Math.floor(diff / 3600000);
                      const m = Math.floor((diff % 3600000) / 60000);
                      const dur = h > 0 ? `${h}h ${m}m` : `${m}m`;
                      return (
                        <div key={b.id} className="flex items-center justify-between px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-white">{b.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Since {new Date(b.breakStart).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/New_York" })} EST
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-amber-400 bg-amber-950 border border-amber-700 px-2 py-0.5 rounded-full">
                            {dur}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Live — currently clocked in */}
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Live &mdash; Currently Clocked In
            </h2>

            {data.active.length === 0 && (
              <div className="bg-gray-900 rounded-xl p-6 text-center text-gray-500 text-sm mb-6">
                Nobody is clocked in right now
              </div>
            )}

            {SHIFTS.map((shift) => {
              const active = activeByShift(shift);
              if (!active.length) return null;
              const c = SHIFT_COLORS[shift];
              return (
                <div key={shift} className={`mb-4 rounded-xl overflow-hidden border ${c.border}`}>
                  <div className={`${c.bg} ${c.text} px-4 py-2 text-xs font-semibold flex items-center gap-1.5`}>
                    {SHIFT_EMOJI[shift]} {shift} &middot; {SHIFT_HOURS[shift].label}
                  </div>
                  <div className="bg-gray-900 divide-y divide-gray-800">
                    {active.map((r) => (
                      <div key={r.id} className="flex items-center justify-between px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-white">{r.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">In at {formatTime(r.clockIn)} EST</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-semibold ${c.badge} px-2 py-0.5 rounded-full`}>
                            {formatDuration(r.clockIn)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Today's completed sessions */}
            {data.today.some((r) => r.clockOut) && (
              <>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-6">
                  Today&apos;s Completed Sessions
                </h2>
                {SHIFTS.map((shift) => {
                  const done = todayByShift(shift).filter((r) => r.clockOut);
                  if (!done.length) return null;
                  const c = SHIFT_COLORS[shift];
                  return (
                    <div key={shift} className="mb-4 rounded-xl overflow-hidden border border-gray-800">
                      <div className="bg-gray-800 px-4 py-2 text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                        {SHIFT_EMOJI[shift]} {shift}
                      </div>
                      <div className="bg-gray-900 divide-y divide-gray-800">
                        {done.map((r) => (
                          <div key={r.id} className="flex items-center justify-between px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-white">{r.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {formatTime(r.clockIn)} &rarr; {formatTime(r.clockOut!)} EST
                              </p>
                            </div>
                            <span className="text-xs font-semibold text-gray-300 bg-gray-800 px-2 py-0.5 rounded-full">
                              {r.hoursWorked}h
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}

        {/* ── History ── */}
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            History
          </h2>

          <div className="bg-gray-900 rounded-xl p-4 space-y-4">
            {/* Date row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Hour row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From hour (EST)</label>
                <select
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Any time</option>
                  {HOURS.map((h) => (
                    <option key={h} value={h}>{hourLabel(h)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To hour (EST)</label>
                <select
                  value={endHour}
                  onChange={(e) => setEndHour(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Any time</option>
                  {HOURS.map((h) => (
                    <option key={h} value={h}>{hourLabel(h)}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={loadHistory}
              disabled={historyLoading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-60"
            >
              {historyLoading ? "Loading..." : "Load History"}
            </button>
          </div>

          {historyError && (
            <div className="mt-3 rounded-xl px-4 py-3 bg-red-950 border border-red-700">
              <p className="text-xs text-red-400">{historyError}</p>
            </div>
          )}

          {historyData && (
            <div className="mt-4 space-y-4">
              {/* Summary bar */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-900 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">{historyData.totals.length}</p>
                  <p className="text-xs text-gray-400 mt-1">People</p>
                </div>
                <div className="bg-gray-900 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">{historyData.records.length}</p>
                  <p className="text-xs text-gray-400 mt-1">Sessions</p>
                </div>
                <div className="bg-gray-900 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">
                    {historyData.totals.reduce((s, t) => s + t.hours, 0).toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Total Hours</p>
                </div>
              </div>

              {/* Per-person totals table */}
              {historyData.totals.length === 0 ? (
                <div className="bg-gray-900 rounded-xl p-6 text-center text-gray-500 text-sm">
                  No completed sessions found for this period
                </div>
              ) : (
                <div className="bg-gray-900 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">Hours by Person</p>
                    <button
                      onClick={() => exportCSV(historyData.records)}
                      className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Export CSV
                    </button>
                  </div>
                  <div className="divide-y divide-gray-800">
                    {historyData.totals.map((t) => (
                      <div key={t.name} className="flex items-center justify-between px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-white">{t.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{t.shift} &middot; {t.sessions} session{t.sessions !== 1 ? "s" : ""}</p>
                        </div>
                        <span className="text-sm font-bold text-indigo-400">{t.hours}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw records toggle */}
              {historyData.records.length > 0 && (
                <div className="bg-gray-900 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowRawRecords((v) => !v)}
                    className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold text-gray-300 hover:bg-gray-800 transition-colors"
                  >
                    <span>All Sessions ({historyData.records.length})</span>
                    <span className="text-gray-500 text-xs">{showRawRecords ? "▲ Hide" : "▼ Show"}</span>
                  </button>
                  {showRawRecords && (
                    <div className="divide-y divide-gray-800 border-t border-gray-800">
                      {historyData.records.map((r) => (
                        <div key={r.id} className="flex items-center justify-between px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-white">{r.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {r.date} &middot; {formatTime(r.clockIn)} &rarr; {r.clockOut ? formatTime(r.clockOut) : "—"} EST
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-gray-300 bg-gray-800 px-2 py-0.5 rounded-full">
                            {r.hoursWorked ?? "—"}h
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Back link */}
        <div className="text-center mt-8">
          <a href="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            &larr; Back to Clock In/Out
          </a>
        </div>
      </div>
    </main>
  );
}
