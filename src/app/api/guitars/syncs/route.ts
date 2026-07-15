import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/guitars/syncs — last 20 sync runs
export async function GET() {
  const runs = await db.syncRun.findMany({
    orderBy: { checkedAt: "desc" },
    take: 20,
  });
  return NextResponse.json(runs);
}
