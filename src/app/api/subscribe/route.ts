import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { name, email, phone } = await req.json();

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const subscriber = await db.subscriber.upsert({
      where: { email: email.toLowerCase().trim() },
      create: { name: name.trim(), email: email.toLowerCase().trim(), phone: phone?.trim() || null, active: true },
      update: { name: name.trim(), phone: phone?.trim() || null, active: true },
    });

    return NextResponse.json(subscriber, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  try {
    const subscribers = await db.subscriber.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(subscribers);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
