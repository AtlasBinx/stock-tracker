"use client";

import { useEffect, useState } from "react";
import { PLANS, type PlanKey } from "@/lib/stripe";

type Mode = "trial" | PlanKey;

export default function SignupPage() {
  const [refCode, setRefCode] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("annual");
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [promoCode, setPromoCode] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "conflict">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) {
      const upper = ref.toUpperCase();
      setRefCode(upper);
      setPromoCode(upper);
      setMode("trial"); // default to trial when ref code present
    }
  }, []);

  const hasTrial = !!refCode;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode !== "trial" && !agreed) {
      setErrorMsg("Please agree to the billing terms before continuing.");
      return;
    }
    setStatus("loading");
    setErrorMsg("");

    if (mode === "trial") {
      const res = await fetch("/api/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, promoCode }),
      });
      const data = await res.json();
      if (res.status === 409) {
        setStatus("conflict");
        return;
      }
      if (!res.ok) {
        setErrorMsg(data.error ?? "Something went wrong");
        setStatus("error");
        return;
      }
      setStatus("success");
      return;
    }

    // Paid plans → Stripe checkout
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan: mode,
        ...form,
        promoCode: promoCode || undefined,
        smsConsent,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error ?? "Something went wrong");
      setStatus("error");
      return;
    }
    window.location.href = data.url;
  }

  const isPaid = mode !== "trial";
  const plan = isPaid ? PLANS[mode as PlanKey] : null;

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--background)" }}>
        <div className="max-w-md w-full text-center">
          <div className="text-5xl mb-4">🎸</div>
          <h1 className="text-2xl font-bold mb-2">You&apos;re in!</h1>
          <p className="mb-4" style={{ color: "var(--text-muted)" }}>
            Check your email — your trial is active for 30 days. We&apos;ll text you the second something drops at Guitars Garden.
          </p>
          <a
            href="/account"
            className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition"
          >
            View my account →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>

      {/* ── Hero ── */}
      <div className="px-4 pt-16 pb-12 text-center">
        <p className="text-5xl mb-4">🎸</p>
        <h1 className="text-4xl font-extrabold tracking-tight mb-3 leading-tight">
          Be first when<br />Guitars Garden drops
        </h1>
        <p className="text-lg max-w-md mx-auto mb-2" style={{ color: "var(--text-muted)" }}>
          Get a <strong className="text-white">text message and email</strong> the second new guitars hit the store.
          Never miss a drop again.
        </p>
        {hasTrial ? (
          <p className="text-sm text-emerald-400 font-medium">
            🎁 Referral code applied — free 30-day trial unlocked
          </p>
        ) : (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Plans start at $2.99 · No auto-renewal
          </p>
        )}
      </div>

      {/* ── How it works ── */}
      <div className="max-w-2xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { step: "1", title: "Sign up", body: "Takes 30 seconds. No commitment." },
            { step: "2", title: "We watch 24/7", body: "Our scanner checks Guitars Garden every hour, day and night." },
            { step: "3", title: "You get the alert", body: "Email every time. Add your phone for an instant text the second it drops." },
          ].map(({ step, title, body }) => (
            <div key={step} className="rounded-xl p-4" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center mx-auto mb-3">
                {step}
              </div>
              <p className="font-semibold text-sm mb-1">{title}</p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main form card ── */}
      <div className="max-w-2xl mx-auto px-4 pb-16">

        {/* Plan selector */}
        <div className={`grid gap-3 mb-6 ${hasTrial ? "grid-cols-3" : "grid-cols-2"}`}>

          {/* Free trial — only shown with ref code */}
          {hasTrial && (
            <button
              onClick={() => setMode("trial")}
              className="relative rounded-2xl p-4 text-left transition"
              style={{
                backgroundColor: mode === "trial" ? "rgba(16,185,129,0.12)" : "var(--surface)",
                border: mode === "trial" ? "2px solid #10b981" : "2px solid var(--border)",
              }}
            >
              <span className="absolute -top-3 left-3 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                Free
              </span>
              <p className="font-semibold text-sm mt-1">30-Day Trial</p>
              <p className="text-xl font-bold mt-1">$0</p>
              <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Referral exclusive · Phone required
              </p>
            </button>
          )}

          {/* 30-day pass */}
          <button
            onClick={() => setMode("30day")}
            className="relative rounded-2xl p-4 text-left transition"
            style={{
              backgroundColor: mode === "30day" ? "rgba(99,102,241,0.15)" : "var(--surface)",
              border: mode === "30day" ? "2px solid #6366f1" : "2px solid var(--border)",
            }}
          >
            <p className="font-semibold text-sm">30-Day Pass</p>
            <p className="text-xl font-bold mt-1">
              $2.99
              <span className="text-xs font-normal ml-1" style={{ color: "var(--text-muted)" }}>/ 30 days</span>
            </p>
            <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Drop incoming? Get in now · No renewal
            </p>
          </button>

          {/* Annual */}
          <button
            onClick={() => setMode("annual")}
            className="relative rounded-2xl p-4 text-left transition"
            style={{
              backgroundColor: mode === "annual" ? "rgba(99,102,241,0.15)" : "var(--surface)",
              border: mode === "annual" ? "2px solid #6366f1" : "2px solid var(--border)",
            }}
          >
            <span className="absolute -top-3 left-3 rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-semibold text-white">
              Best value
            </span>
            <p className="font-semibold text-sm mt-1">Annual</p>
            <p className="text-xl font-bold mt-1">
              $14.99
              <span className="text-xs font-normal ml-1" style={{ color: "var(--text-muted)" }}>/year</span>
            </p>
            <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>
              $1.25/mo · No renewal
            </p>
          </button>
        </div>

        {/* Form */}
        <div className="rounded-2xl p-7" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
          <h2 className="font-semibold mb-5">
            {mode === "trial" ? "Start your free trial" : mode === "annual" ? "Get annual access" : "Get 30-day access"}
          </h2>

          {status === "conflict" && (
            <div className="mb-5 rounded-xl p-4 text-sm" style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <p className="font-semibold text-red-400 mb-1">Email already used</p>
              <p style={{ color: "var(--text-muted)" }}>
                This email has already had a free trial.{" "}
                <button onClick={() => { setMode("annual"); setStatus("idle"); }} className="text-indigo-400 hover:underline font-medium">
                  Upgrade to annual ($14.99/yr) →
                </button>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Jane Smith"
                  className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-indigo-500"
                  style={{ backgroundColor: "var(--surface-2)" }}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="jane@example.com"
                  className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-indigo-500"
                  style={{ backgroundColor: "var(--surface-2)" }}
                />
              </div>
            </div>

            {/* Phone — required for trial, optional with SMS opt-in for paid */}
            {mode === "trial" ? (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Phone number <span className="text-red-400">*</span>
                  <span className="ml-1 text-xs font-normal text-emerald-400">(required — we&apos;ll text you instantly when something drops)</span>
                </label>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+1 555 000 0000"
                  className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-indigo-500"
                  style={{ backgroundColor: "var(--surface-2)" }}
                />
                <div className="mt-2 rounded-lg px-3 py-2 text-xs font-medium text-emerald-400" style={{ backgroundColor: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                  ✓ No credit card required. Your 30-day trial starts the moment you hit the button.
                </div>
                <p className="mt-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  By entering your phone number you agree to receive automated stock alert texts.
                  Msg &amp; data rates may apply. Reply STOP to opt out anytime.
                </p>
              </div>
            ) : (
              <div className="rounded-xl p-4" style={{ backgroundColor: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)" }}>
                <p className="mb-2 text-xs font-semibold text-indigo-300 uppercase tracking-wide">
                  📱 Text alerts — Get notified instantly
                </p>
                <label className="flex items-start gap-3 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={smsConsent}
                    onChange={(e) => {
                      setSmsConsent(e.target.checked);
                      if (!e.target.checked) setForm((f) => ({ ...f, phone: "" }));
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                    <strong className="text-white">Yes, text me when something drops</strong> — I agree to receive automated stock alert texts from Guitar Stock Alert.
                    Msg &amp; data rates may apply. Reply <strong className="text-white">STOP</strong> to opt out anytime.
                  </span>
                </label>
                {smsConsent && (
                  <input
                    type="tel"
                    required={smsConsent}
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+1 555 000 0000"
                    className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-indigo-500"
                    style={{ backgroundColor: "var(--surface-2)" }}
                  />
                )}
              </div>
            )}

            {/* Referral code — shown for paid plans if ref present, or manually entered */}
            {isPaid && (showPromoInput || promoCode) ? (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Referral code</label>
                <input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="CREATORNAME"
                  autoFocus={showPromoInput && !promoCode}
                  className="w-full rounded-lg px-3 py-2.5 text-sm text-white font-mono placeholder-gray-500 outline-none focus:ring-2 focus:ring-indigo-500"
                  style={{ backgroundColor: "var(--surface-2)" }}
                />
              </div>
            ) : isPaid ? (
              <button
                type="button"
                onClick={() => setShowPromoInput(true)}
                className="text-xs text-indigo-400 hover:underline"
              >
                Have a referral code?
              </button>
            ) : null}

            {/* Billing terms for paid plans */}
            {isPaid && plan && (
              <>
                <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <p className="font-medium mb-2">Order summary — {plan.name}</p>
                  <ul className="space-y-1 text-xs" style={{ color: "var(--text-muted)" }}>
                    <li>• <strong className="text-white">${plan.price}</strong> charged once for {plan.billing} of access</li>
                    <li>• Email alerts included · Add your phone for instant SMS alerts</li>
                    <li>• <strong className="text-emerald-400">No automatic renewal. No future charges.</strong></li>
                    <li>• Manage your account at <span className="text-indigo-400">guitarstockalert.com/account</span></li>
                  </ul>
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                    I agree to be charged <strong className="text-white">${plan.price}</strong> for the {plan.name} and understand the billing terms above.
                  </span>
                </label>
              </>
            )}

            {(status === "error" || errorMsg) && status !== "conflict" && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 ring-1 ring-red-500/30">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading" || (isPaid && !agreed)}
              className="w-full rounded-lg bg-indigo-600 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {status === "loading"
                ? "Please wait…"
                : mode === "trial"
                ? "Activate free trial — no card, ever"
                : mode === "annual"
                ? "Get annual access — $14.99"
                : "Get 30-day access — $2.99"}
            </button>

            {mode === "trial" && (
              <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
                Free for 30 days · No credit card · No hidden charges
              </p>
            )}
            {isPaid && (
              <div className="flex items-center justify-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#6366f1", flexShrink: 0 }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Secure payment via <strong className="text-white">Stripe</strong> · We never see your card details
              </div>
            )}
          </form>
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          Already subscribed?{" "}
          <a href="/account" className="text-indigo-400 hover:underline">
            Manage your account →
          </a>
        </p>
        <p className="mt-3 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          <a href="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</a>
          {" · "}
          <a href="/terms" className="text-indigo-400 hover:underline">Terms of Service</a>
          {" · "}
          <a href="/sms-optin" className="text-indigo-400 hover:underline">SMS opt-in</a>
        </p>
        <p className="mt-2 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          SMS opt-in is optional and not required to purchase or use this service.
        </p>
      </div>
    </div>
  );
}
