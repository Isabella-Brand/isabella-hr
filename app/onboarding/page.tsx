"use client";

import { useState } from "react";

type FormState = "idle" | "loading" | "success" | "error";

export default function OnboardingPage() {
  const [state, setState] = useState<FormState>("idle");
  const [errMsg, setErrMsg] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    country: "",
    startDate: "",
    telegramHandle: "",
    telegramUserId: "",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setErrMsg("");

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      setState("success");
    } catch (err: any) {
      setErrMsg(err.message);
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-white mb-2">You&apos;re all set!</h1>
          <p className="text-gray-400 text-sm">
            Your information has been submitted. The team will be in touch shortly.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">Isabella</h1>
          <p className="text-gray-400 text-sm mt-1">Team Onboarding</p>
        </div>

        <div className="bg-gray-900 rounded-2xl shadow-xl p-6">
          <p className="text-gray-400 text-sm mb-6">
            Welcome to the team! Please fill in your details below to complete your onboarding.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  First Name *
                </label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                  required
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                  required
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Personal Email *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Country
              </label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Start Date
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Telegram Handle (@username)
              </label>
              <input
                type="text"
                value={form.telegramHandle}
                onChange={(e) => set("telegramHandle", e.target.value)}
                placeholder="@username"
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Telegram User ID *
              </label>
              <input
                type="text"
                value={form.telegramUserId}
                onChange={(e) => set("telegramUserId", e.target.value)}
                placeholder="e.g. 123456789"
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                Message <span className="text-indigo-400 font-medium">@userinfobot</span> on Telegram — it will instantly reply with your numeric ID. Paste it here.
              </p>
            </div>

            {state === "error" && (
              <div className="rounded-xl px-4 py-3 bg-red-950 border border-red-700">
                <p className="text-xs text-red-400">{errMsg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={state === "loading"}
              className="w-full py-4 rounded-xl text-base font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all active:scale-95 disabled:opacity-60 mt-2"
            >
              {state === "loading" ? "Submitting..." : "Submit Onboarding Form"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
