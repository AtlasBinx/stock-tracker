import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPurchaseConfirmationEmail } from "@/lib/mailer";
import { sendSmsOptInConfirmation } from "@/lib/sms";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, smsConsent, promoCode } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if this email has ever existed — no second free trials
    const existing = await db.subscriber.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json(
        { error: "already_exists", message: "This email has already used a free trial." },
        { status: 409 }
      );
    }

    // Validate affiliate code if provided
    let affiliateCodeId: number | null = null;
    if (promoCode) {
      const upper = promoCode.toUpperCase().trim();
      const found = await db.affiliateCode.findUnique({ where: { code: upper } });
      if (found?.active) affiliateCodeId = found.id;
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    const subscriber = await db.subscriber.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: phone?.trim() || null,
        active: true,
        plan: "trial",
        planStatus: "active",
        accessExpiresAt: trialEndsAt,
        smsConsent: !!smsConsent,
        promoCode: promoCode?.toUpperCase().trim() || null,
      },
    });

    // Record affiliate use (free trial — $0 amount, $0 bounty, tracked for volume)
    if (affiliateCodeId) {
      await db.affiliateUse.create({
        data: {
          codeId: affiliateCodeId,
          subscriberId: subscriber.id,
          plan: "trial",
          amount: 0,
          bounty: 0,
        },
      });
    }

    // Send welcome email
    await sendPurchaseConfirmationEmail(
      { name: subscriber.name, email: subscriber.email },
      "trial",
      0,
      trialEndsAt
    );

    // Send SMS opt-in confirmation if they consented and provided a phone
    if (smsConsent && subscriber.phone) {
      await sendSmsOptInConfirmation(subscriber.phone);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[trial] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
