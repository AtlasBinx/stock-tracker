import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendStockAddedEmail } from "@/lib/mailer";

export async function POST() {
  try {
    const subscribers = await db.subscriber.findMany({ where: { active: true } });
    if (subscribers.length === 0) {
      return NextResponse.json({ error: "No active subscribers" }, { status: 400 });
    }

    await sendStockAddedEmail(
      subscribers.map((s) => ({ name: s.name, email: s.email })),
      ["Test Product — Fender Stratocaster (Example)", "Test Product — Gibson Les Paul (Example)"]
    );

    return NextResponse.json({ sent: subscribers.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
