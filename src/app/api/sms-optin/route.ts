import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendSmsOptInConfirmation, toE164 } from "@/lib/sms";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { phone: rawPhone, email } = await req.json();
    const phone = rawPhone ? toE164(rawPhone) : null;

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // If email provided and subscriber exists, update their SMS consent + phone
    if (email) {
      const existing = await db.subscriber.findUnique({ where: { email } });
      if (existing) {
        await db.subscriber.update({
          where: { email },
          data: { phone, smsConsent: true },
        });
        await sendSmsOptInConfirmation(phone);
        return NextResponse.json({ ok: true });
      }
    }

    // No matching subscriber — still send confirmation so Twilio reviewer can verify
    await sendSmsOptInConfirmation(phone);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
