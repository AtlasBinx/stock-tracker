import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function periodStats(uses: { createdAt: Date; amount: number; bounty: number }[], since: Date) {
  const filtered = uses.filter((u) => new Date(u.createdAt) >= since);
  return {
    subs: filtered.length,
    revenue: filtered.reduce((s, u) => s + u.amount, 0),
    bounty: filtered.reduce((s, u) => s + u.bounty, 0),
  };
}

export async function GET() {
  const now = new Date();

  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const yearStart = new Date(now.getFullYear(), 0, 1);

  const codes = await db.affiliateCode.findMany({
    include: { uses: { orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  const report = codes.map((c) => {
    const uses = c.uses as { createdAt: Date; amount: number; bounty: number; plan: string }[];
    return {
      id: c.id,
      code: c.code,
      creatorName: c.creatorName,
      active: c.active,
      createdAt: c.createdAt,
      weekly: periodStats(uses, weekAgo),
      monthly: periodStats(uses, monthStart),
      ytd: periodStats(uses, yearStart),
      allTime: {
        subs: uses.length,
        revenue: uses.reduce((s, u) => s + u.amount, 0),
        bounty: uses.reduce((s, u) => s + u.bounty, 0),
      },
    };
  });

  return NextResponse.json(report);
}
