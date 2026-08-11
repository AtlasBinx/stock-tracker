import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toE164 } from "@/lib/sms";
import { isAdminRequest, unauthorizedResponse } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorizedResponse();
  try {
    const { name, email, phone: rawPhone } = await req.json();
    const phone = rawPhone?.trim() ? toE164(rawPhone.trim()) : null;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const subscriber = await db.subscriber.upsert({
      where: { email: email.toLowerCase().trim() },
      create: { name: name.trim(), email: email.toLowerCase().trim(), phone, active: true },
      update: { name: name.trim(), phone, active: true },
    });

    return NextResponse.json(subscriber, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorizedResponse();
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
