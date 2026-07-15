"use client";

import { useState } from "react";

const PLAN_LABELS: Record<string, string> = {
  monthly: "Monthly ($2.99/mo)",
  "3month": "3-Month Pass ($7.99)",
  annual: "Annual Pass ($24.99)",
};

export default function AccountPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "redirecting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleManage(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const res = await fetch("/api/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const data = await res.json();
      setErrorMsg(data.error ?? "No subscription found for this email.");
      setStatus("error");
      return;
    }

    const { url } = await res.json();
    setStatus("redirecting");
    window.location.href = url;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4" style={{ backgroundColor: "var(--background)" }}>
      <div className="w-full max-w-md rounded-2xl p-8 shadow-2xl" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="mb-6 text-center">
          <p className="text-3xl">🎸</p>
          <h1 className="mt-3 text-xl font-bold">Manage Your Subscription</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            Enter your email to access the self-service portal where you can cancel, update payment info, or view billing history.
          </p>
        </div>

        <form onSubmit={handleManage} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Email address
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-indigo-500"
              style={{ backgroundColor: "var(--surface-2)" }}
            />
          </div>

          {status === "error" && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 ring-1 ring-red-500/30">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "loading" || status === "redirecting"}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {status === "loading" || status === "redirecting"
              ? "Opening portal…"
              : "Open my account portal →"}
          </button>
        </form>

        <div className="mt-6 rounded-xl p-4 text-xs space-y-1" style={{ backgroundColor: "var(--surface-2)", color: "var(--text-muted)" }}>
          <p className="font-medium text-white">In the portal you can:</p>
          <p>• Cancel your subscription (access continues through paid period)</p>
          <p>• Update your payment method</p>
          <p>• Download invoices</p>
          <p>• View billing history</p>
        </div>

        <p className="mt-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          Not a subscriber yet?{" "}
          <a href="/signup" className="text-indigo-400 hover:underline">
            View plans →
          </a>
        </p>
      </div>
    </div>
  );
}
