"use client";

import { useCallback, useEffect, useState } from "react";

// ---- Types --------------------------------------------------------

interface GuitarProduct {
  id: number;
  shopifyId: string;
  title: string;
  handle: string;
  sku: string | null;
  price: string | null;
  available: boolean;
  active: boolean;
  firstSeen: string;
  lastSeen: string;
}

interface Subscriber {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  active: boolean;
  createdAt: string;
}

interface GuitarEvent {
  id: number;
  type: "ADDED" | "REMOVED" | "WENT_IN_STOCK" | "WENT_OUT_OF_STOCK";
  createdAt: string;
  product: { title: string; handle: string; price: string | null; available: boolean };
}

interface SyncRun {
  id: number;
  checkedAt: string;
  totalProducts: number;
  added: number;
  removed: number;
  wentInStock: number;
  wentOutOfStock: number;
}

interface SyncResult {
  totalProducts: number;
  added: string[];
  removed: string[];
  wentInStock: string[];
  wentOutOfStock: string[];
  error?: string;
}

// ---- Constants ----------------------------------------------------

const STORE_BASE = "https://guitarsgarden.com/products";
const REFRESH_MS = 60_000;
type Tab = "catalog" | "subscribers";

const EVENT_CONFIG = {
  ADDED:            { label: "Added to store",    color: "text-emerald-400", bg: "bg-emerald-500/10 ring-emerald-500/30", dot: "bg-emerald-400" },
  REMOVED:          { label: "Removed from store", color: "text-red-400",     bg: "bg-red-500/10 ring-red-500/30",         dot: "bg-red-500" },
  WENT_IN_STOCK:    { label: "Back in stock",      color: "text-blue-400",    bg: "bg-blue-500/10 ring-blue-500/30",        dot: "bg-blue-400" },
  WENT_OUT_OF_STOCK:{ label: "Out of stock",       color: "text-amber-400",   bg: "bg-amber-500/10 ring-amber-500/30",      dot: "bg-amber-400" },
} as const;

// ---- Main component -----------------------------------------------

export default function DashboardPage() {
  const [products, setProducts]     = useState<GuitarProduct[]>([]);
  const [events, setEvents]         = useState<GuitarEvent[]>([]);
  const [syncs, setSyncs]           = useState<SyncRun[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [filter, setFilter]         = useState<"all" | "available" | "unavailable" | "removed">("all");
  const [tab, setTab]               = useState<Tab>("catalog");
  const [syncing, setSyncing]       = useState(false);
  const [loading, setLoading]       = useState(true);
  const [lastSync, setLastSync]     = useState<Date | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const fetchAll = useCallback(async () => {
    const [pRes, eRes, sRes, subRes] = await Promise.all([
      fetch(`/api/guitars?filter=${filter}`),
      fetch("/api/guitars/events?limit=80"),
      fetch("/api/guitars/syncs"),
      fetch("/api/subscribe"),
    ]);
    const [p, e, s, sub] = await Promise.all([pRes.json(), eRes.json(), sRes.json(), subRes.json()]);
    setProducts(p);
    setEvents(e);
    setSyncs(s);
    setSubscribers(Array.isArray(sub) ? sub : []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Auto-refresh products list every minute
  useEffect(() => {
    const id = setInterval(fetchAll, REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchAll]);

  async function handleUnsubscribe(id: number) {
    if (!confirm("Remove this subscriber?")) return;
    await fetch(`/api/subscribe/${id}`, { method: "DELETE" });
    setSubscribers((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const result: SyncResult = await res.json();
      setSyncResult(result);
      setLastSync(new Date());
      await fetchAll();
    } finally {
      setSyncing(false);
    }
  }

  // Summary counts from current product list
  const allProducts = products;
  const available   = allProducts.filter((p) => p.active && p.available).length;
  const unavailable = allProducts.filter((p) => p.active && !p.available).length;
  const removed     = allProducts.filter((p) => !p.active).length;
  const lastRun     = syncs[0] ?? null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

      {/* ── Header ── */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Guitars Garden</h1>
            <a
              href="https://guitarsgarden.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-400 hover:underline"
            >
              ↗ Visit store
            </a>
          </div>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {lastRun
              ? `Last synced ${new Date(lastRun.checkedAt).toLocaleString()} · ${lastRun.totalProducts} products in store`
              : "Never synced — click Sync Now to load the catalog"}
          </p>
        </div>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          <RefreshIcon spinning={syncing} />
          {syncing ? "Syncing…" : "Sync Now"}
        </button>
      </div>

      {/* ── Sync result flash ── */}
      {syncResult && (
        <SyncResultBanner result={syncResult} onDismiss={() => setSyncResult(null)} />
      )}

      {/* ── Summary cards ── */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="In Stock"    value={available}   color="text-emerald-400" />
        <StatCard label="Out of Stock" value={unavailable} color="text-amber-400" />
        <StatCard label="Removed"     value={removed}     color="text-red-400" />
        <StatCard label="Total Seen"  value={allProducts.length} color="text-gray-300" />
      </div>

      {/* ── Tabs ── */}
      <div className="mb-6 flex gap-1 border-b" style={{ borderColor: "var(--border)" }}>
        {(["catalog", "subscribers"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition border-b-2 -mb-px ${
              tab === t
                ? "border-indigo-500 text-white"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            {t === "subscribers"
              ? `Subscribers (${subscribers.filter((s) => s.active).length})`
              : "Catalog"}
          </button>
        ))}
        <a
          href="/signup"
          target="_blank"
          className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-400 ring-1 ring-indigo-500/30 hover:bg-indigo-500/10 transition self-center"
        >
          🔗 Signup page
        </a>
      </div>

      {tab === "subscribers" ? (
        <SubscriberTable subscribers={subscribers} onRemove={handleUnsubscribe} />
      ) : (
      /* ── Two-column layout ── */
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Product catalog — takes 2/3 width */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Catalog</h2>
            <div className="flex gap-1">
              {(["all", "available", "unavailable", "removed"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition ${
                    filter === f
                      ? "bg-indigo-600 text-white"
                      : "text-gray-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : products.length === 0 ? (
            <EmptyState message={`No ${filter === "all" ? "" : filter + " "}products yet — click Sync Now`} />
          ) : (
            <ProductCatalog products={products} />
          )}
        </div>

        {/* Change log — takes 1/3 */}
        <div>
          <h2 className="mb-3 font-semibold">Change Log</h2>
          {events.length === 0 ? (
            <EmptyState message="No events yet" />
          ) : (
            <div
              className="overflow-hidden rounded-xl"
              style={{ border: "1px solid var(--border)" }}
            >
              <div className="max-h-[700px] overflow-y-auto">
                {events.map((e) => (
                  <EventRow key={e.id} event={e} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      )}

      {/* ── Sync history ── */}
      {syncs.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 font-semibold">Sync History</h2>
          <div className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                  {["Time", "Products", "Added", "Removed", "→ In Stock", "→ Out of Stock"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {syncs.map((s, i) => (
                  <tr
                    key={s.id}
                    style={{
                      backgroundColor: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)",
                      borderBottom: i < syncs.length - 1 ? "1px solid var(--border)" : undefined,
                    }}
                  >
                    <td className="px-4 py-2.5 tabular-nums" style={{ color: "var(--text-muted)" }}>
                      {new Date(s.checkedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums">{s.totalProducts}</td>
                    <td className="px-4 py-2.5 tabular-nums text-emerald-400">{s.added > 0 ? `+${s.added}` : "—"}</td>
                    <td className="px-4 py-2.5 tabular-nums text-red-400">{s.removed > 0 ? `-${s.removed}` : "—"}</td>
                    <td className="px-4 py-2.5 tabular-nums text-blue-400">{s.wentInStock > 0 ? s.wentInStock : "—"}</td>
                    <td className="px-4 py-2.5 tabular-nums text-amber-400">{s.wentOutOfStock > 0 ? s.wentOutOfStock : "—"}</td>
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

// ---- Sub-components -----------------------------------------------

function ProductCatalog({ products }: { products: GuitarProduct[] }) {
  return (
    <div className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--border)" }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
              {["Product", "SKU", "Price", "Status"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr
                key={p.id}
                style={{
                  backgroundColor: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)",
                  borderBottom: i < products.length - 1 ? "1px solid var(--border)" : undefined,
                  opacity: p.active ? 1 : 0.45,
                }}
              >
                <td className="px-4 py-3">
                  <a
                    href={`${STORE_BASE}/${p.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-indigo-400 hover:underline"
                  >
                    {p.title}
                  </a>
                </td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                  {p.sku ?? "—"}
                </td>
                <td className="px-4 py-3 tabular-nums">
                  {p.price ? `$${p.price}` : "—"}
                </td>
                <td className="px-4 py-3">
                  {!p.active ? (
                    <Badge classes="bg-red-500/10 text-red-400 ring-red-500/30" dot="bg-red-500" label="Removed" />
                  ) : p.available ? (
                    <Badge classes="bg-emerald-500/15 text-emerald-400 ring-emerald-500/30" dot="bg-emerald-400" label="In Stock" />
                  ) : (
                    <Badge classes="bg-amber-500/15 text-amber-400 ring-amber-500/30" dot="bg-amber-400" label="Out of Stock" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EventRow({ event }: { event: GuitarEvent }) {
  const cfg = EVENT_CONFIG[event.type];
  return (
    <div
      className="flex items-start gap-3 px-4 py-3"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{event.product.title}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
          {event.product.price && (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              ${event.product.price}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
          {new Date(event.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function SyncResultBanner({ result, onDismiss }: { result: SyncResult; onDismiss: () => void }) {
  const hasChanges =
    result.added.length + result.removed.length + result.wentInStock.length + result.wentOutOfStock.length > 0;

  return (
    <div
      className="mb-6 rounded-xl p-4"
      style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium">
            {result.error
              ? `Sync failed: ${result.error}`
              : hasChanges
              ? `Sync complete — ${result.totalProducts} products, changes detected`
              : `Sync complete — ${result.totalProducts} products, no changes`}
          </p>
          {hasChanges && (
            <ul className="mt-2 space-y-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
              {result.added.map((t) => <li key={t} className="text-emerald-400">+ Added: {t}</li>)}
              {result.removed.map((t) => <li key={t} className="text-red-400">− Removed: {t}</li>)}
              {result.wentInStock.map((t) => <li key={t} className="text-blue-400">↑ Back in stock: {t}</li>)}
              {result.wentOutOfStock.map((t) => <li key={t} className="text-amber-400">↓ Out of stock: {t}</li>)}
            </ul>
          )}
        </div>
        <button onClick={onDismiss} className="shrink-0 text-gray-500 hover:text-white">✕</button>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className={`mt-1 text-3xl font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function Badge({ label, classes, dot }: { label: string; classes: string; dot: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${classes}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center rounded-xl py-16" style={{ border: "1px dashed var(--border)" }}>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>{message}</p>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <RefreshIcon spinning size={24} />
      <span className="ml-3 text-sm text-gray-400">Loading…</span>
    </div>
  );
}

function SubscriberTable({
  subscribers,
  onRemove,
}: {
  subscribers: Subscriber[];
  onRemove: (id: number) => void;
}) {
  const active = subscribers.filter((s) => s.active);

  if (active.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl py-24 text-center" style={{ border: "1px dashed var(--border)" }}>
        <p className="text-lg font-medium text-gray-400">No subscribers yet</p>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          Share the{" "}
          <a href="/signup" target="_blank" className="text-indigo-400 hover:underline">signup page</a>
          {" "}to start collecting emails.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)" }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
            {["Name", "Email", "Phone", "Signed up", ""].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {active.map((s, i) => (
            <tr
              key={s.id}
              style={{
                backgroundColor: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)",
                borderBottom: i < active.length - 1 ? "1px solid var(--border)" : undefined,
              }}
            >
              <td className="px-4 py-3 font-medium">{s.name}</td>
              <td className="px-4 py-3 text-indigo-400">{s.email}</td>
              <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>{s.phone ?? "—"}</td>
              <td className="px-4 py-3 tabular-nums" style={{ color: "var(--text-muted)" }}>
                {new Date(s.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onRemove(s.id)}
                  className="rounded-md px-2.5 py-1 text-xs font-medium text-red-400 ring-1 ring-red-500/40 hover:bg-red-500/10 transition"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RefreshIcon({ spinning = false, size = 16 }: { spinning?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" className={spinning ? "animate-spin" : undefined}>
      <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z" />
      <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z" />
    </svg>
  );
}
