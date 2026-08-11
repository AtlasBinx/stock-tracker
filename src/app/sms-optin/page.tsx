"use client";

import { useState } from "react";

export default function SmsOptInPage() {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      setErrorMsg("You must agree to receive SMS messages to continue.");
      return;
    }
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/sms-optin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, email: email || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setStatus("success");
    } catch (err) {
      setErrorMsg(String(err));
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--background)" }}>
        <div className="mx-auto max-w-md text-center">
          <p className="text-5xl mb-6">✅</p>
          <h1 className="text-2xl font-bold text-white mb-3">You're opted in!</h1>
          <p className="text-sm leading-relaxed mb-2" style={{ color: "var(--text-muted)" }}>
            You'll receive a confirmation text shortly. Guitar Stock Alert will send you SMS notifications when new or restocked guitar inventory is detected at Guitars Garden.
          </p>
          <p className="text-sm mt-4" style={{ color: "var(--text-muted)" }}>
            Reply <strong className="text-white">STOP</strong> at any time to unsubscribe from SMS alerts.
          </p>
          <a
            href="/signup"
            className="mt-8 inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition"
          >
            Subscribe to get alerts →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: "var(--background)" }}>
      <div className="mx-auto w-full max-w-md">

        <div className="mb-8 text-center">
          <p className="text-4xl mb-3">🎸</p>
          <h1 className="text-2xl font-bold text-white">SMS Stock Alerts</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            Opt in to receive text message alerts from Guitar Stock Alert when new or restocked guitars are available at Guitars Garden.
          </p>
        </div>

        <div className="rounded-2xl p-8" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Mobile phone number <span className="text-red-400">*</span>
              </label>
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 000 0000"
                className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ backgroundColor: "var(--surface-2)" }}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Email address{" "}
                <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>(optional — links to your existing account)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ backgroundColor: "var(--surface-2)" }}
              />
            </div>

            {/* TCPA consent */}
            <div className="rounded-xl p-4" style={{ backgroundColor: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)" }}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                  I agree to receive automated SMS stock alert messages from{" "}
                  <strong className="text-white">Guitar Stock Alert</strong> at the phone number provided above.
                  Message frequency varies based on store activity (typically a few times per month).{" "}
                  <strong className="text-white">Msg &amp; data rates may apply.</strong>{" "}
                  Reply <strong className="text-white">STOP</strong> to opt out at any time.
                  Reply <strong className="text-white">HELP</strong> for help.
                  This consent is not required as a condition of purchase or service.
                </span>
              </label>
            </div>

            {errorMsg && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 ring-1 ring-red-500/30">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading" || !consent}
              className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {status === "loading" ? "Submitting…" : "Opt in to SMS alerts"}
            </button>

          </form>
        </div>

        <p className="mt-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          SMS opt-in is voluntary and not required to use this service.
          <br />
          <a href="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</a>
          {" · "}
          <a href="/terms" className="text-indigo-400 hover:underline">Terms of Service</a>
        </p>

        <p className="mt-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          Not yet a subscriber?{" "}
          <a href="/signup" className="text-indigo-400 hover:underline">View plans →</a>
        </p>
      </div>
    </div>
  );
}
