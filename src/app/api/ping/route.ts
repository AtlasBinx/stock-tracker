import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const count = await db.guitarProduct.count();
    return NextResponse.json({ ok: true, count, cwd: process.cwd() });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.stack ?? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
