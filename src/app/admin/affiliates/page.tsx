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

function fmt(n: number) { return `$${n.toFixed(2)}`; }

function exportPDF(selected: AffiliateReport[]) {
  const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const rows = selected.map((r) => `
    <tr>
      <td>${r.creatorName}</td>
      <td>${r.code}</td>
      <td>${r.monthly.subs}</td>
      <td>$${r.monthly.revenue.toFixed(2)}</td>
      <td>$${r.monthly.bounty.toFixed(2)}</td>
      <td>${r.ytd.subs}</td>
      <td>$${r.ytd.revenue.toFixed(2)}</td>
      <td>$${r.ytd.bounty.toFixed(2)}</td>
      <td>$${r.allTime.revenue.toFixed(2)}</td>
      <td>$${r.allTime.bounty.toFixed(2)}</td>
    </tr>
  `).join("");

  const totalMonthlyBounty = selected.reduce((s, r) => s + r.monthly.bounty, 0);
  const totalAllTimeBounty = selected.reduce((s, r) => s + r.allTime.bounty, 0);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Affiliate Report — ${now}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .subtitle { color: #666; font-size: 13px; margin-bottom: 32px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #f4f4f4; text-align: left; padding: 8px 12px; border-bottom: 2px solid #ddd; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 8px 12px; border-bottom: 1px solid #eee; }
    tr:last-child td { border-bottom: none; }
    .summary { margin-top: 24px; font-size: 13px; color: #444; }
    .summary strong { color: #111; }
    .section-header { background: #e8e8e8; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Guitar Stock Alert — Affiliate Report</h1>
  <div class="subtitle">Generated ${now} · ${selected.length} creator${selected.length !== 1 ? "s" : ""}</div>
  <table>
    <thead>
      <tr>
        <th>Creator</th>
        <th>Code</th>
        <th>Mo. Subs</th>
        <th>Mo. Revenue</th>
        <th>Mo. Bounty</th>
        <th>YTD Subs</th>
        <th>YTD Revenue</th>
        <th>YTD Bounty</th>
        <th>All-Time Rev</th>
        <th>All-Time Bounty</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="summary">
    <p>Monthly bounty owed (selected): <strong>$${totalMonthlyBounty.toFixed(2)}</strong></p>
    <p>All-time bounty owed (selected): <strong>$${totalAllTimeBounty.toFixed(2)}</strong></p>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

export default function AffiliatesPage() {
  const [report, setReport] = useState<AffiliateReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState({ code: "", creatorName: "" });
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());

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

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(selected.size === report.length ? new Set() : new Set(report.map((r) => r.id)));
  }

  const selectedCreators = report.filter((r) => selected.has(r.id));
  const totalRevenue = report.reduce((s, r) => s + r.allTime.revenue, 0);
  const totalBounty = report.reduce((s, r) => s + r.allTime.bounty, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Affiliate / Referral Codes</h1>
      <p className="mb-8 text-sm" style={{ color: "var(--text-muted)" }}>
        All-time revenue via codes: <strong className="text-white">{fmt(totalRevenue)}</strong> ·
        Total bounty owed: <strong className="text-amber-400">{fmt(totalBounty)}</strong>
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

      {!loading && report.length > 0 && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {selected.size > 0 ? `${selected.size} creator${selected.size !== 1 ? "s" : ""} selected` : "Select creators to export"}
          </p>
          <button
            onClick={() => exportPDF(selectedCreators)}
            disabled={selected.size === 0}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            Export Selected as PDF
          </button>
        </div>
      )}

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
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.size === report.length && report.length > 0}
                      onChange={toggleAll}
                      className="rounded border-gray-600"
                    />
                  </th>
                  {["Code", "Creator", "Weekly subs", "Monthly subs", "Mo. bounty", "YTD subs", "YTD revenue", "YTD bounty", "All-time rev", "All-time bounty", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.map((r, i) => (
                  <tr
                    key={r.code}
                    onClick={() => toggleSelect(r.id)}
                    className="cursor-pointer"
                    style={{
                      backgroundColor: selected.has(r.id) ? "rgba(99,102,241,0.08)" : i % 2 === 0 ? "var(--surface)" : "var(--surface-2)",
                      borderBottom: i < report.length - 1 ? "1px solid var(--border)" : undefined,
                      outline: selected.has(r.id) ? "1px solid rgba(99,102,241,0.3)" : undefined,
                    }}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(r.id)}
                        onChange={() => toggleSelect(r.id)}
                        className="rounded border-gray-600"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-indigo-400">{r.code}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{r.creatorName}</td>
                    <td className="px-4 py-3 tabular-nums">{r.weekly.subs}</td>
                    <td className="px-4 py-3 tabular-nums">{r.monthly.subs}</td>
                    <td className="px-4 py-3 tabular-nums text-amber-400">{fmt(r.monthly.bounty)}</td>
                    <td className="px-4 py-3 tabular-nums">{r.ytd.subs}</td>
                    <td className="px-4 py-3 tabular-nums text-emerald-400">{fmt(r.ytd.revenue)}</td>
                    <td className="px-4 py-3 tabular-nums text-amber-400">{fmt(r.ytd.bounty)}</td>
                    <td className="px-4 py-3 tabular-nums text-emerald-400">{fmt(r.allTime.revenue)}</td>
                    <td className="px-4 py-3 tabular-nums text-amber-400">{fmt(r.allTime.bounty)}</td>
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
