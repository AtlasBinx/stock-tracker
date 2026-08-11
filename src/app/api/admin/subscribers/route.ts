import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toE164 } from "@/lib/sms";

export const dynamic = "force-dynamic";

// POST — manually add a subscriber (bypasses Stripe, for testing/comps)
export async function POST(req: NextRequest) {
  const secret = process.env.ADMIN_PASSWORD;
  const auth = req.headers.get("x-admin-password");
  if (!secret || auth !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, email, phone: rawPhone, plan, accessExpiresAt } = await req.json();
  const phone = rawPhone ? toE164(rawPhone) : null;
  if (!name || !email || !plan) {
    return NextResponse.json({ error: "name, email, and plan are required" }, { status: 400 });
  }

  const subscriber = await db.subscriber.upsert({
    where: { email },
    create: {
      name,
      email,
      phone: phone || null,
      active: true,
      plan,
      planStatus: "active",
      accessExpiresAt: accessExpiresAt ? new Date(accessExpiresAt) : null,
      smsConsent: false,
    },
    update: {
      name,
      phone: phone || null,
      active: true,
      plan,
      planStatus: "active",
      accessExpiresAt: accessExpiresAt ? new Date(accessExpiresAt) : null,
    },
  });

  return NextResponse.json(subscriber, { status: 201 });
}
