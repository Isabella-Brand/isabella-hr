"use client";

import { useEffect, useState } from "react";

type Employee = { id: string; name: string };
type PageState = "idle" | "loading" | "submitting" | "success" | "error";

export default function UpdateTelegramPage() {
  const [employees, setEmployees]   = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [tgId, setTgId]             = useState("");
  const [pageState, setPageState]   = useState<PageState>("loading");
  const [errMsg, setErrMsg]         = useState("");

  useEffect(() => {
    fetch("/api/update-tg")
      .then((r) => r.json())
      .then((data) => {
        setEmployees(data.employees ?? []);
        setPageState("idle");
      })
      .catch(() => {
        setErrMsg("Could not load employee list. Try refreshing.");
        setPageState("error");
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId || !tgId.trim()) return;
    setPageState("submitting");
    setErrMsg("");
    try {
      const res = await fetch("/api/update-tg", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, telegramUserId: tgId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      setPageState("success");
    } catch (err: any) {
      setErrMsg(err.message);
      setPageState("error");
    }
  }

  const selectedName = employees.find((e) => e.id === employeeId)?.name ?? "";

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-4 text-2xl">
            ✦
          </div>
          <h1 className="text-white text-xl font-bold">Isabella Team</h1>
          <p className="text-gray-400 text-sm mt-1">Link your Telegram account</p>
        </div>

        {pageState === "success" ? (
          <div className="bg-gray-900 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-green-400 font-semibold text-lg">You&apos;re all set!</p>
            <p className="text-gray-400 text-sm mt-2">
              Telegram ID saved for <span className="text-white font-medium">{selectedName}</span>.
            </p>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-2xl p-6">

            {/* How-to callout */}
            <div className="bg-indigo-950 border border-indigo-800 rounded-xl p-4 mb-6">
              <p className="text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
                How to find your Telegram ID
              </p>
              <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
                <li>Open Telegram</li>
                <li>Search for <span className="text-indigo-300 font-medium">@userinfobot</span></li>
                <li>Tap <span className="font-medium">Start</span></li>
                <li>Copy the number next to <span className="font-medium">Id:</span></li>
              </ol>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                  Your Name *
                </label>
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  required
                  disabled={pageState === "loading" || pageState === "submitting"}
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <option value="">— Select your name —</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                  Your Telegram ID *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={tgId}
                  onChange={(e) => setTgId(e.target.value.replace(/\D/g, ""))}
                  required
                  placeholder="e.g. 123456789"
                  disabled={pageState === "submitting"}
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
                <p className="text-gray-500 text-xs mt-1.5">Numbers only — not your username.</p>
              </div>

              {pageState === "error" && errMsg && (
                <div className="rounded-xl px-4 py-3 bg-red-950 border border-red-700">
                  <p className="text-xs text-red-400">{errMsg}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!employeeId || !tgId || pageState === "submitting" || pageState === "loading"}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {pageState === "submitting" ? "Saving..." : "Save My Telegram ID"}
              </button>
            </form>
          </div>
        )}

      </div>
    </main>
  );
}
