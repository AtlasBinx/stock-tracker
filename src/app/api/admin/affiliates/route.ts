import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const codes = await db.affiliateCode.findMany({
    include: { uses: true },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const report = codes.map((c) => {
    const uses = c.uses as { createdAt: Date; amount: number; bounty: number; plan: string }[];
    const period = (since: Date) => {
      const f = uses.filter((u) => new Date(u.createdAt) >= since);
      return { subs: f.length, revenue: f.reduce((s, u) => s + u.amount, 0), bounty: f.reduce((s, u) => s + u.bounty, 0) };
    };
    return {
      id: c.id,
      code: c.code,
      creatorName: c.creatorName,
      active: c.active,
      createdAt: c.createdAt,
      weekly: period(weekAgo),
      monthly: period(monthStart),
      ytd: period(yearStart),
      allTime: { subs: uses.length, revenue: uses.reduce((s, u) => s + u.amount, 0), bounty: uses.reduce((s, u) => s + u.bounty, 0) },
    };
  });

  return NextResponse.json(report);
}

// POST — create a new affiliate code (tracking only, no Stripe discount)
export async function POST(req: Request) {
  const { code, creatorName } = await req.json();
  if (!code || !creatorName) {
    return NextResponse.json({ error: "code and creatorName required" }, { status: 400 });
  }

  const upperCode = code.toUpperCase();

  const existing = await db.affiliateCode.findUnique({ where: { code: upperCode } });
  if (existing) {
    return NextResponse.json({ error: "Code already exists" }, { status: 409 });
  }

  const affiliateCode = await db.affiliateCode.create({
    data: { code: upperCode, creatorName },
  });

  return NextResponse.json(affiliateCode, { status: 201 });
}
