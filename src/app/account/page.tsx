"use client";

import { useState } from "react";

interface SubInfo {
  name: string;
  plan: string | null;
  planLabel: string | null;
  planStatus: string | null;
  active: boolean;
  accessExpiresAt: string | null;
  hasStripe: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function AccountPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "found" | "redirecting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [subInfo, setSubInfo] = useState<SubInfo | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    setSubInfo(null);

    const res = await fetch(`/api/portal?email=${encodeURIComponent(email)}`);
    if (!res.ok) {
      const data = await res.json();
      setErrorMsg(data.error ?? "No subscription found for this email.");
      setStatus("error");
      return;
    }

    const data = await res.json();
    setSubInfo(data);
    setStatus("found");
  }

  async function handleOpenPortal() {
    setPortalLoading(true);
    const res = await fetch("/api/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      setPortalLoading(false);
      return;
    }
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4" style={{ backgroundColor: "var(--background)" }}>
      <div className="w-full max-w-md rounded-2xl p-8 shadow-2xl" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="mb-6 text-center">
          <p className="text-3xl">🎸</p>
          <h1 className="mt-3 text-xl font-bold">Manage Your Subscription</h1>
          {status !== "found" && (
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Enter your email to view your subscription status.
            </p>
          )}
        </div>

        {status !== "found" && (
          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Email address</label>
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
              disabled={status === "loading"}
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {status === "loading" ? "Looking up…" : "Look up my account →"}
            </button>
          </form>
        )}

        {status === "found" && subInfo && (
          <div className="space-y-4">
            {/* Subscriber info */}
            <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: "var(--surface-2)" }}>
              <p className="text-sm font-medium text-white">{subInfo.name}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{email}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Plan: <span className="text-white">{subInfo.planLabel ?? subInfo.plan ?? "—"}</span>
              </p>
            </div>

            {/* Status banner */}
            {subInfo.planStatus === "cancelling" && subInfo.accessExpiresAt && (
              <div className="rounded-xl p-4" style={{ backgroundColor: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.3)" }}>
                <p className="text-sm font-semibold text-orange-400">Subscription cancelled</p>
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  You still have full access until{" "}
                  <strong className="text-white">{formatDate(subInfo.accessExpiresAt)}</strong>.
                  After that date your alerts will stop.
                </p>
              </div>
            )}

            {subInfo.planStatus === "cancelled" && (
              <div className="rounded-xl p-4" style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
                <p className="text-sm font-semibold text-red-400">Subscription ended</p>
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  Your subscription has ended. Subscribe again to resume alerts.
                </p>
                <a
                  href="/signup"
                  className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition"
                >
                  Resubscribe →
                </a>
              </div>
            )}

            {subInfo.planStatus === "active" && subInfo.accessExpiresAt && (
              <div className="rounded-xl p-4" style={{ backgroundColor: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}>
                <p className="text-sm font-semibold text-emerald-400">Active — access until {formatDate(subInfo.accessExpiresAt)}</p>
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  One-time pass — no renewal, no future charges.
                </p>
              </div>
            )}

            {subInfo.planStatus === "active" && !subInfo.accessExpiresAt && (
              <div className="rounded-xl p-4" style={{ backgroundColor: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}>
                <p className="text-sm font-semibold text-emerald-400">Active — renews monthly</p>
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  Your subscription is active. Cancel anytime — access continues through your paid period.
                </p>
              </div>
            )}

            {/* Portal button (only for Stripe subs) */}
            {subInfo.hasStripe && subInfo.planStatus !== "cancelled" && (
              <button
                onClick={handleOpenPortal}
                disabled={portalLoading}
                className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
              >
                {portalLoading ? "Opening portal…" : "Manage billing & payment →"}
              </button>
            )}

            <button
              onClick={() => { setStatus("idle"); setSubInfo(null); setEmail(""); }}
              className="w-full text-center text-xs hover:underline"
              style={{ color: "var(--text-muted)" }}
            >
              Look up a different email
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          Not a subscriber yet?{" "}
          <a href="/signup" className="text-indigo-400 hover:underline">View plans →</a>
        </p>
      </div>
    </div>
  );
}
