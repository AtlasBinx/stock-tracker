"use client";

import { useState } from "react";

export default function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Something went wrong");
        setStatus("error");
      } else {
        setStatus("success");
      }
    } catch {
      setErrorMsg("Network error — please try again");
      setStatus("error");
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 shadow-2xl"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {/* Logo / header */}
        <div className="mb-8 text-center">
          <p className="text-3xl">🎸</p>
          <h1 className="mt-3 text-2xl font-bold">Guitars Garden Stock Alerts</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            Get an email the moment new guitars are added to the store.
          </p>
        </div>

        {status === "success" ? (
          <div className="text-center">
            <p className="text-4xl">✅</p>
            <p className="mt-4 text-lg font-semibold">You&apos;re signed up!</p>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              We&apos;ll email you at <strong>{form.email}</strong> whenever new stock is added.
            </p>
            <button
              onClick={() => { setStatus("idle"); setForm({ name: "", email: "", phone: "" }); }}
              className="mt-6 text-sm text-indigo-400 hover:underline"
            >
              Sign up another person
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Jane Smith"
                className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition focus:ring-2 focus:ring-indigo-500"
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
                className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition focus:ring-2 focus:ring-indigo-500"
                style={{ backgroundColor: "var(--surface-2)" }}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Phone <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>(optional)</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+1 555 000 0000"
                className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition focus:ring-2 focus:ring-indigo-500"
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
              {status === "loading" ? "Signing up…" : "Notify me when stock is added"}
            </button>

            <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
              No spam. Email only. Unsubscribe any time.
            </p>
          </form>
        )}
      </div>

    </div>
  );
}
