"use client";

import { useState, useEffect, useCallback } from "react";
import {
  SHIFT_COLORS,
  SHIFT_EMOJI,
  SHIFT_HOURS,
  type Shift,
} from "@/lib/roster";
import type { AttendanceRecord } from "@/lib/sheets";

interface DashboardData {
  active: AttendanceRecord[];
  today: AttendanceRecord[];
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

const SHIFTS: Shift[] = ["Morning", "Afternoon", "Graveyard"];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

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
    const t = setInterval(fetchData, 60_000); // auto-refresh every 60s
    return () => clearInterval(t);
  }, [fetchData]);

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
