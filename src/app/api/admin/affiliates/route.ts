import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest, unauthorizedResponse } from "@/lib/auth";
import { sendAffiliateWelcomeEmail } from "@/lib/mailer";
import { sendSmsOptInConfirmation } from "@/lib/sms";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorizedResponse();
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

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorizedResponse();
  const { code, creatorName, email, phone } = await req.json();
  if (!code || !creatorName || !email) {
    return NextResponse.json({ error: "code, creatorName, and email required" }, { status: 400 });
  }

  const upperCode = code.toUpperCase();

  const existing = await db.affiliateCode.findUnique({ where: { code: upperCode } });
  if (existing) {
    return NextResponse.json({ error: "Code already exists" }, { status: 409 });
  }

  const affiliateCode = await db.affiliateCode.create({
    data: { code: upperCode, creatorName, email, phone: phone || null },
  });

  // Create or update their subscriber record with permanent free access
  await db.subscriber.upsert({
    where: { email },
    create: {
      name: creatorName,
      email,
      phone: phone || null,
      active: true,
      plan: "affiliate",
      planStatus: "active",
      accessExpiresAt: null,
      smsConsent: !!phone,
    },
    update: {
      active: true,
      plan: "affiliate",
      planStatus: "active",
      accessExpiresAt: null,
      smsConsent: !!phone,
    },
  });

  // Send welcome email and SMS opt-in confirmation
  await sendAffiliateWelcomeEmail({ name: creatorName, email }, upperCode);
  if (phone) await sendSmsOptInConfirmation(phone);

  return NextResponse.json(affiliateCode, { status: 201 });
}
