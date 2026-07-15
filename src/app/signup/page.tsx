"use client";

import { useEffect, useState } from "react";
import { PLANS, type PlanKey } from "@/lib/stripe";

const PLAN_KEYS = Object.keys(PLANS) as PlanKey[];

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("monthly");
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [promoCode, setPromoCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "conflict">("idle");
  const [switching, setSwitching] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [conflictData, setConflictData] = useState<{ subscriptionId: string; customerId: string } | null>(null);
  const [agreed, setAgreed] = useState(false);

  // Auto-fill promo code from ?ref= URL param
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) setPromoCode(ref.toUpperCase());
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) { setErrorMsg("Please agree to the terms before continuing."); return; }
    setStatus("loading");
    setErrorMsg("");

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: selectedPlan, ...form, promoCode: promoCode || undefined }),
    });

    if (res.status === 409) {
      const data = await res.json();
      setConflictData(data);
      setStatus("conflict");
      return;
    }

    if (!res.ok) {
      const data = await res.json();
      setErrorMsg(data.error ?? "Something went wrong");
      setStatus("error");
      return;
    }

    const { url } = await res.json();
    window.location.href = url;
  }

  async function handleSwitchPlan() {
    setSwitching(true);
    // Cancel existing monthly sub then proceed to checkout for the new plan
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan: selectedPlan,
        ...form,
        promoCode: promoCode || undefined,
        cancelExisting: true,
      }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else { setErrorMsg(data.error ?? "Something went wrong"); setStatus("error"); setSwitching(false); }
  }

  const plan = PLANS[selectedPlan];

  return (
    <div className="min-h-screen px-4 py-12" style={{ backgroundColor: "var(--background)" }}>
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-10 text-center">
          <p className="text-4xl">🎸</p>
          <h1 className="mt-3 text-3xl font-bold">Guitars Garden Stock Alerts</h1>
          <p className="mt-2" style={{ color: "var(--text-muted)" }}>
            Get an email the moment new guitars hit the store. Cancel anytime.
          </p>
        </div>

        {/* Plan selector */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PLAN_KEYS.map((key) => {
            const p = PLANS[key];
            const isSelected = selectedPlan === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedPlan(key)}
                className="relative rounded-2xl p-5 text-left transition"
                style={{
                  backgroundColor: isSelected ? "rgba(99,102,241,0.15)" : "var(--surface)",
                  border: isSelected ? "2px solid #6366f1" : "2px solid var(--border)",
                }}
              >
                {key === "annual" && (
                  <span className="absolute -top-3 left-4 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold text-white">
                    Best value
                  </span>
                )}
                <p className="font-semibold">{p.name}</p>
                <p className="mt-1 text-2xl font-bold">
                  ${p.price}
                  <span className="text-sm font-normal" style={{ color: "var(--text-muted)" }}>
                    {" "}/ {p.billing}
                  </span>
                </p>
                <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {p.tagline}
                </p>
                {!p.renews && (
                  <p className="mt-2 text-xs font-semibold text-emerald-400">
                    ✓ One-time charge · Never auto-renews
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {/* Conflict state */}
        {status === "conflict" && conflictData && (
          <div className="mb-6 rounded-xl p-5" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
            <p className="font-semibold">You already have an active Monthly plan</p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              To switch to the {plan.name}, your current monthly subscription will be cancelled first (you keep access through your current paid period), then you&apos;ll be charged for the new plan.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleSwitchPlan}
                disabled={switching}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {switching ? "Switching…" : `Switch to ${plan.name}`}
              </button>
              <button
                onClick={() => setStatus("idle")}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
              >
                Keep my monthly plan
              </button>
            </div>
          </div>
        )}

        {/* Sign-up form */}
        {status !== "conflict" && (
          <div className="rounded-2xl p-8" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
            <h2 className="mb-6 font-semibold">Your details</h2>
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">
                    Phone <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+1 555 000 0000"
                    className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-indigo-500"
                    style={{ backgroundColor: "var(--surface-2)" }}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">
                    Promo code <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>(optional)</span>
                  </label>
                  <input
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="EXAMPLE10"
                    className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none font-mono focus:ring-2 focus:ring-indigo-500"
                    style={{ backgroundColor: "var(--surface-2)" }}
                  />
                </div>
              </div>

              {/* Terms disclosure */}
              <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <p className="font-medium mb-2">Order summary — {plan.name}</p>
                <ul className="space-y-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  <li>• <strong className="text-white">${plan.price}</strong> charged {plan.renews ? "today, then monthly until cancelled" : `once for ${plan.billing} of access`}</li>
                  {plan.renews
                    ? <li>• Auto-renews monthly at ${plan.price}. Cancel anytime — access continues through your paid period.</li>
                    : <li>• This is a one-time charge. Your access ends after {plan.billing} with <strong className="text-emerald-400">no automatic renewal and no future charges.</strong></li>
                  }
                  <li>• Cancel or manage your subscription anytime at <span className="text-indigo-400">stock-tracker-seven-delta.vercel.app/account</span></li>
                  <li>• Alerts sent to your email only. Unsubscribe from emails at any time.</li>
                </ul>
              </div>

              {/* Consent checkbox */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                  I agree to be charged <strong className="text-white">${plan.price}</strong> for the {plan.name} and understand the terms above.
                </span>
              </label>

              {status === "error" && (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 ring-1 ring-red-500/30">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "loading" || !agreed}
                className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
              >
                {status === "loading" ? "Redirecting to checkout…" : `Subscribe — $${plan.price} / ${plan.billing}`}
              </button>

              <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
                Secure payment via Stripe · We never see your card details
              </p>
            </form>
          </div>
        )}

        <p className="mt-6 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          Already subscribed?{" "}
          <a href="/account" className="text-indigo-400 hover:underline">
            Manage your account →
          </a>
        </p>
      </div>
    </div>
  );
}
