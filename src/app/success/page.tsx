"use client";

import { useEffect, useState } from "react";

export default function SuccessPage() {
  const [checked, setChecked] = useState(false);

  useEffect(() => { setChecked(true); }, []);

  if (!checked) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center" style={{ backgroundColor: "var(--background)" }}>
      <div className="max-w-md rounded-2xl p-10 shadow-2xl" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
        <p className="text-5xl">🎸</p>
        <h1 className="mt-4 text-2xl font-bold">You&apos;re in!</h1>
        <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
          Your subscription is active. You&apos;ll receive a confirmation email shortly with your plan details and how to cancel.
        </p>
        <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
          We&apos;ll email you every time new guitars are added to{" "}
          <a href="https://guitarsgarden.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
            Guitars Garden
          </a>.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <a
            href="/account"
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition"
          >
            Manage my subscription →
          </a>
          <a
            href="https://guitarsgarden.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-400 hover:underline"
          >
            Visit Guitars Garden
          </a>
        </div>
      </div>
    </div>
  );
}
