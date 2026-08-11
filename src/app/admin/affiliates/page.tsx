"use client";

import { useEffect, useState } from "react";

interface PeriodStats { subs: number; revenue: number; bounty: number }
interface AffiliateReport {
  id: number;
  code: string;
  creatorName: string;
  active: boolean;
  createdAt: string;
  weekly: PeriodStats;
  monthly: PeriodStats;
  ytd: PeriodStats;
  allTime: PeriodStats;
}

export default function AffiliatesPage() {
  const [report, setReport] = useState<AffiliateReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState({ code: "", creatorName: "" });
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState("");

  const load = () =>
    fetch("/api/admin/affiliates").then((r) => r.json()).then((d) => { setReport(d); setLoading(false); });

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateMsg("");
    const res = await fetch("/api/admin/affiliates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCode),
    });
    const data = await res.json();
    if (res.ok) {
      setCreateMsg(`✓ Created code ${data.code}`);
      setNewCode({ code: "", creatorName: "" });
      load();
    } else {
      setCreateMsg(`Error: ${data.error}`);
    }
    setCreating(false);
  }

  const totalRevenue = report.reduce((s, r) => s + r.allTime.revenue, 0);
  const totalBounty = report.reduce((s, r) => s + r.allTime.bounty, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Affiliate / Referral Codes</h1>
      <p className="mb-8 text-sm" style={{ color: "var(--text-muted)" }}>
        All-time revenue via codes: <strong className="text-white">${totalRevenue.toFixed(2)}</strong> ·
        Total bounty owed: <strong className="text-amber-400">${totalBounty.toFixed(2)}</strong>
      </p>

      <div className="mb-8 rounded-xl p-6" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
        <h2 className="mb-4 font-semibold">Create new referral code</h2>
        <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="mb-1 block text-xs text-gray-400">Code</label>
            <input
              required
              value={newCode.code}
              onChange={(e) => setNewCode((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="SARAH"
              className="rounded-lg px-3 py-2 text-sm font-mono text-white outline-none focus:ring-2 focus:ring-indigo-500"
              style={{ backgroundColor: "var(--surface-2)" }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Creator name</label>
            <input
              required
              value={newCode.creatorName}
              onChange={(e) => setNewCode((f) => ({ ...f, creatorName: e.target.value }))}
              placeholder="Sarah Smith"
              className="rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500"
              style={{ backgroundColor: "var(--surface-2)" }}
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create"}
          </button>
          {createMsg && <p className="text-sm text-emerald-400">{createMsg}</p>}
        </form>
        <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
          Tracking only — no discount applied to the subscriber. Share as a typed code or link: <span className="text-indigo-400">/signup?ref=CODE</span>
        </p>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : report.length === 0 ? (
        <p className="text-gray-400">No referral codes yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--border)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                  {["Code", "Creator", "Weekly subs", "Monthly subs", "YTD subs", "YTD revenue", "YTD bounty", "All-time rev", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.map((r, i) => (
                  <tr key={r.code} style={{ backgroundColor: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)", borderBottom: i < report.length - 1 ? "1px solid var(--border)" : undefined }}>
                    <td className="px-4 py-3 font-mono font-semibold text-indigo-400">{r.code}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{r.creatorName}</td>
                    <td className="px-4 py-3 tabular-nums">{r.weekly.subs}</td>
                    <td className="px-4 py-3 tabular-nums">{r.monthly.subs}</td>
                    <td className="px-4 py-3 tabular-nums">{r.ytd.subs}</td>
                    <td className="px-4 py-3 tabular-nums text-emerald-400">${r.ytd.revenue.toFixed(2)}</td>
                    <td className="px-4 py-3 tabular-nums text-amber-400">${r.ytd.bounty.toFixed(2)}</td>
                    <td className="px-4 py-3 tabular-nums text-emerald-400">${r.allTime.revenue.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                        {r.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
