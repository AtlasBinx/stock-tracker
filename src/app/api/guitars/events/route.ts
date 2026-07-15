import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/guitars/events?limit=50&type=ADDED|REMOVED|WENT_IN_STOCK|WENT_OUT_OF_STOCK
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100", 10), 500);
  const type = searchParams.get("type");

  const events = await db.guitarEvent.findMany({
    where: type ? { type: type as never } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      product: { select: { title: true, handle: true, price: true, available: true } },
    },
  });

  return NextResponse.json(events);
}
