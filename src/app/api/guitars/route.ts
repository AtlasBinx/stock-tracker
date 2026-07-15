import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") ?? "all";

    const where =
      filter === "available"
        ? { active: true, available: true }
        : filter === "unavailable"
        ? { active: true, available: false }
        : filter === "removed"
        ? { active: false }
        : {};

    const products = await db.guitarProduct.findMany({
      where,
      orderBy: [{ available: "desc" }, { title: "asc" }],
    });

    return NextResponse.json(products);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.stack ?? e.message : String(e);
    console.error("[/api/guitars]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
