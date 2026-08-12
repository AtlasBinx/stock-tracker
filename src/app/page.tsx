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
  plan: string | null;
  planStatus: string | null;
  accessExpiresAt: string | null;
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
type Tab = "catalog" | "subscribers" | "affiliates";

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
  const [affiliates, setAffiliates] = useState<AffiliateReport[]>([]);
  const [filter, setFilter]         = useState<"all" | "available" | "unavailable" | "removed">("all");
  const [tab, setTab]               = useState<Tab>("catalog");
  const [syncing, setSyncing]       = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [loading, setLoading]       = useState(true);
  const [lastSync, setLastSync]     = useState<Date | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const fetchAll = useCallback(async () => {
    const [pRes, eRes, sRes, subRes, affRes] = await Promise.all([
      fetch(`/api/guitars?filter=${filter}`),
      fetch("/api/guitars/events?limit=80"),
      fetch("/api/guitars/syncs"),
      fetch("/api/subscribe"),
      fetch("/api/affiliates"),
    ]);
    const [p, e, s, sub, aff] = await Promise.all([pRes.json(), eRes.json(), sRes.json(), subRes.json(), affRes.json()]);
    setProducts(p);
    setEvents(e);
    setSyncs(s);
    setSubscribers(Array.isArray(sub) ? sub : []);
    setAffiliates(Array.isArray(aff) ? aff : []);
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

  async function handleTestEmail(recipientEmails?: string[]) {
    setTestEmailStatus("sending");
    try {
      const res = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmails }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTestEmailStatus("sent");
      setTimeout(() => setTestEmailStatus("idle"), 4000);
    } catch {
      setTestEmailStatus("error");
      setTimeout(() => setTestEmailStatus("idle"), 4000);
    }
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

        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            <RefreshIcon spinning={syncing} />
            {syncing ? "Syncing…" : "Sync Now"}
          </button>
          <button
            onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; }}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-400 ring-1 transition hover:text-white"
            style={{ border: "1px solid var(--border)" }}
          >
            Sign out
          </button>
        </div>
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
        {(["catalog", "subscribers", "affiliates"] as Tab[]).map((t) => (
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
              : t === "affiliates"
              ? `Affiliates (${affiliates.length})`
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

      {tab === "affiliates" ? (
        <AffiliatesTab affiliates={affiliates} onRefresh={fetchAll} />
      ) : tab === "subscribers" ? (
        <div className="space-y-6">
          <MessagingPanel
            testStatus={testEmailStatus}
            onTest={handleTestEmail}
            subscribers={subscribers.filter((s) => s.active)}
          />
          <SubscriberTable subscribers={subscribers} onRemove={handleUnsubscribe} />
        </div>
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

const PLAN_LABELS: Record<string, string> = {
  trial: "Free Trial",
  "30day": "30-Day Pass",
  annual: "Annual",
  monthly: "Monthly", // legacy
};

const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  active:    { label: "Active",    classes: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30" },
  cancelled: { label: "Cancelled", classes: "bg-red-500/10 text-red-400 ring-red-500/30" },
  expired:   { label: "Expired",   classes: "bg-amber-500/10 text-amber-400 ring-amber-500/30" },
};

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
    <div className="overflow-x-auto overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)" }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
            {["Name", "Email", "Phone", "Plan", "Status", "Expires", "Signed up", ""].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {active.map((s, i) => {
            const statusStyle = STATUS_STYLES[s.planStatus ?? ""] ?? { label: s.planStatus ?? "—", classes: "bg-gray-500/10 text-gray-400 ring-gray-500/30" };
            return (
              <tr
                key={s.id}
                style={{
                  backgroundColor: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)",
                  borderBottom: i < active.length - 1 ? "1px solid var(--border)" : undefined,
                }}
              >
                <td className="px-4 py-3 font-medium whitespace-nowrap">{s.name}</td>
                <td className="px-4 py-3 text-indigo-400 whitespace-nowrap">{s.email}</td>
                <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--text-muted)" }}>{s.phone ?? "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {s.plan ? (
                    <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-300 ring-1 ring-inset ring-indigo-500/30">
                      {PLAN_LABELS[s.plan] ?? s.plan}
                    </span>
                  ) : "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {s.planStatus ? (
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusStyle.classes}`}>
                      {statusStyle.label}
                    </span>
                  ) : "—"}
                </td>
                <td className="px-4 py-3 tabular-nums whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                  {s.accessExpiresAt ? new Date(s.accessExpiresAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3 tabular-nums whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MessagingPanel({
  testStatus,
  onTest,
  subscribers,
}: {
  testStatus: "idle" | "sending" | "sent" | "error";
  onTest: (recipientEmails?: string[]) => void;
  subscribers: Subscriber[];
}) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(true);
  const [broadcastStatus, setBroadcastStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [broadcastResult, setBroadcastResult] = useState("");
  // "all" or a subscriber id string
  const [testTarget, setTestTarget] = useState("all");
  const [broadcastTarget, setBroadcastTarget] = useState("all");

  const activeCount = subscribers.length;

  function selectedTestEmails(): string[] | undefined {
    if (testTarget === "all") return undefined;
    const sub = subscribers.find((s) => String(s.id) === testTarget);
    return sub ? [sub.email] : undefined;
  }

  function selectedBroadcastIds(): number[] | undefined {
    if (broadcastTarget === "all") return undefined;
    const id = parseInt(broadcastTarget);
    return isNaN(id) ? undefined : [id];
  }

  function broadcastLabel() {
    if (broadcastTarget === "all") return `Broadcast to ${activeCount}`;
    const sub = subscribers.find((s) => String(s.id) === broadcastTarget);
    return `Send to ${sub?.name ?? "selected"}`;
  }

  async function handleBroadcast(e: React.FormEvent) {
    e.preventDefault();
    const label = broadcastTarget === "all" ? `all ${activeCount} active subscribers` : subscribers.find((s) => String(s.id) === broadcastTarget)?.name ?? "selected subscriber";
    if (!confirm(`Send this message to ${label}?`)) return;
    setBroadcastStatus("sending");
    setBroadcastResult("");
    try {
      const res = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, sendEmail, sendSms, recipientIds: selectedBroadcastIds() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBroadcastResult(`✓ Sent — ${data.emailsSent} emails, ${data.smsSent} texts`);
      setBroadcastStatus("sent");
      setSubject("");
      setMessage("");
      setTimeout(() => { setBroadcastStatus("idle"); setBroadcastResult(""); }, 6000);
    } catch (err) {
      setBroadcastResult(`✕ Failed: ${err}`);
      setBroadcastStatus("error");
      setTimeout(() => { setBroadcastStatus("idle"); setBroadcastResult(""); }, 6000);
    }
  }

  return (
    <div className="rounded-xl p-5 space-y-5" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
      <h2 className="font-semibold">Messaging</h2>

      {/* Test send row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Test to:</span>
        <select
          value={testTarget}
          onChange={(e) => setTestTarget(e.target.value)}
          className="rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500"
          style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)" }}
        >
          <option value="all">All subscribers</option>
          {subscribers.map((s) => (
            <option key={s.id} value={String(s.id)}>{s.name} ({s.email})</option>
          ))}
        </select>
        <button
          onClick={() => onTest(selectedTestEmails())}
          disabled={testStatus === "sending"}
          className="rounded-lg px-3 py-1.5 text-xs font-medium ring-1 transition disabled:opacity-50"
          style={{
            backgroundColor: testStatus === "sent" ? "rgba(16,185,129,0.1)" : testStatus === "error" ? "rgba(239,68,68,0.1)" : "transparent",
            color: testStatus === "sent" ? "#34d399" : testStatus === "error" ? "#f87171" : "var(--text-muted)",
            border: "1px solid var(--border)",
          }}
        >
          {testStatus === "sending" ? "Sending…" : testStatus === "sent" ? "✓ Test sent!" : testStatus === "error" ? "✕ Failed" : "Send Test (Email + SMS)"}
        </button>
      </div>

      <div style={{ borderTop: "1px solid var(--border)" }} />

      {/* Broadcast form */}
      <form onSubmit={handleBroadcast} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs" style={{ color: "var(--text-muted)" }}>Email subject</label>
          <input
            required={sendEmail}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="🎸 Important update from Guitar Stock Alert"
            className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500"
            style={{ backgroundColor: "var(--surface-2)" }}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs" style={{ color: "var(--text-muted)" }}>Message body</label>
          <textarea
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message here. For SMS this will be prefixed with 'Guitar Stock Alert:' and suffixed with 'Reply STOP to opt out.'"
            className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            style={{ backgroundColor: "var(--surface-2)" }}
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Send to:</span>
          <select
            value={broadcastTarget}
            onChange={(e) => setBroadcastTarget(e.target.value)}
            className="rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500"
            style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            <option value="all">All active subscribers ({activeCount})</option>
            {subscribers.map((s) => (
              <option key={s.id} value={String(s.id)}>{s.name} ({s.email})</option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--text-muted)" }}>
              <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="h-4 w-4 rounded" />
              Email
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--text-muted)" }}>
              <input type="checkbox" checked={sendSms} onChange={(e) => setSendSms(e.target.checked)} className="h-4 w-4 rounded" />
              SMS
            </label>
          </div>
          <div className="flex items-center gap-3">
            {broadcastResult && (
              <span className={`text-sm ${broadcastStatus === "sent" ? "text-emerald-400" : "text-red-400"}`}>
                {broadcastResult}
              </span>
            )}
            <button
              type="submit"
              disabled={broadcastStatus === "sending" || (!sendEmail && !sendSms)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition"
            >
              {broadcastStatus === "sending" ? "Sending…" : broadcastLabel()}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function AffiliatesTab({ affiliates, onRefresh }: { affiliates: AffiliateReport[]; onRefresh: () => void }) {
  const [newCode, setNewCode] = useState({ code: "", creatorName: "" });
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState("");
  const [period, setPeriod] = useState<"weekly" | "monthly" | "ytd" | "allTime">("monthly");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setMsg("");
    const res = await fetch("/api/admin/affiliates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCode),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg(`✓ Created ${data.code}`);
      setNewCode({ code: "", creatorName: "" });
      onRefresh();
    } else {
      setMsg(`Error: ${data.error}`);
    }
    setCreating(false);
  }

  const totals = affiliates.reduce(
    (acc, a) => ({
      subs: acc.subs + a[period].subs,
      revenue: acc.revenue + a[period].revenue,
      bounty: acc.bounty + a[period].bounty,
    }),
    { subs: 0, revenue: 0, bounty: 0 }
  );

  const periodLabel = { weekly: "This Week", monthly: "This Month", ytd: "Year to Date", allTime: "All Time" };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl p-4" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Referrals ({periodLabel[period]})</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-indigo-400">{totals.subs}</p>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Revenue ({periodLabel[period]})</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-emerald-400">${totals.revenue.toFixed(2)}</p>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Bounty Owed ({periodLabel[period]})</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-amber-400">${totals.bounty.toFixed(2)}</p>
        </div>
      </div>

      {/* Period selector + table */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Creator Breakdown</h2>
          <div className="flex gap-1">
            {(["weekly", "monthly", "ytd", "allTime"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  period === p ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                {periodLabel[p]}
              </button>
            ))}
          </div>
        </div>

        {affiliates.length === 0 ? (
          <EmptyState message="No referral codes yet — create one below" />
        ) : (
          <div className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--border)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                    {["Creator", "Code", "Links", "Subs", "Revenue", "Bounty Owed", "Status"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {affiliates.map((a, i) => (
                    <tr key={a.id} style={{ backgroundColor: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)", borderBottom: i < affiliates.length - 1 ? "1px solid var(--border)" : undefined }}>
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{a.creatorName}</td>
                      <td className="px-4 py-3 font-mono text-indigo-400">{a.code}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <CopyLink code={a.code} />
                      </td>
                      <td className="px-4 py-3 tabular-nums">{a[period].subs}</td>
                      <td className="px-4 py-3 tabular-nums text-emerald-400">${a[period].revenue.toFixed(2)}</td>
                      <td className="px-4 py-3 tabular-nums text-amber-400">${a[period].bounty.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${a.active ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30" : "bg-red-500/10 text-red-400 ring-red-500/30"}`}>
                          {a.active ? "Active" : "Inactive"}
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

      {/* Create new code */}
      <div className="rounded-xl p-5" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
        <h2 className="mb-3 text-sm font-semibold">Create new referral code</h2>
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
          <button type="submit" disabled={creating} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
            {creating ? "Creating…" : "Create"}
          </button>
          {msg && <p className={`text-sm ${msg.startsWith("✓") ? "text-emerald-400" : "text-red-400"}`}>{msg}</p>}
        </form>
        <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
          Tracking only — no discount is applied to the subscriber. Share as a typed code or link: <span className="text-indigo-400">/signup?ref=CODE</span>
        </p>
      </div>
    </div>
  );
}

function CopyButton({ url, label }: { url: string; label: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-mono truncate max-w-[160px]" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <button
        onClick={handleCopy}
        className="shrink-0 rounded px-2 py-0.5 text-xs font-medium transition"
        style={{
          backgroundColor: copied ? "rgba(16,185,129,0.1)" : "rgba(99,102,241,0.1)",
          color: copied ? "#34d399" : "#818cf8",
          border: copied ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(99,102,241,0.3)",
        }}
      >
        {copied ? "✓" : "Copy"}
      </button>
    </div>
  );
}

function CopyLink({ code }: { code: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <CopyButton
        url={`https://guitarstockalert.com/signup?ref=${code}`}
        label={`/signup?ref=${code}`}
      />
      <CopyButton
        url={`https://guitarstockalert.com/creators/${code}`}
        label={`/creators/${code}`}
      />
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
