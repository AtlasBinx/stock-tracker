import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/guitars/syncs — last sync run + last 10 runs with changes
export async function GET() {
  const [latest, changed] = await Promise.all([
    db.syncRun.findFirst({ orderBy: { checkedAt: "desc" } }),
    db.syncRun.findMany({
      where: { OR: [{ added: { gt: 0 } }, { removed: { gt: 0 } }, { wentInStock: { gt: 0 } }, { wentOutOfStock: { gt: 0 } }] },
      orderBy: { checkedAt: "desc" },
      take: 10,
    }),
  ]);
  // Return latest first (for "last synced" header), then changed runs deduped
  const seen = new Set<number>();
  const runs = [];
  if (latest) { runs.push(latest); seen.add(latest.id); }
  for (const r of changed) { if (!seen.has(r.id)) runs.push(r); }
  return NextResponse.json(runs);
}
