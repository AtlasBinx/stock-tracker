import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendStockAlertEmail } from "@/lib/mailer";
import { sendStockAlertSms } from "@/lib/sms";
import { isAdminRequest, unauthorizedResponse } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorizedResponse();
  try {
    const body = await req.json().catch(() => ({}));
    const { recipientEmails } = body as { recipientEmails?: string[] };

    const where = recipientEmails?.length
      ? { active: true, email: { in: recipientEmails } }
      : { active: true };

    const subscribers = await db.subscriber.findMany({ where });
    if (subscribers.length === 0) {
      return NextResponse.json({ error: "No active subscribers" }, { status: 400 });
    }

    const testProducts = [
      {
        title: "Firefly FF338PRO Full Size Semi Hollow body Electric Guitar （Transparent Blue )",
        url: "https://guitarsgarden.com/products/firefly-ff338pro-full-size-semi-hollow-body-electric-guitar-transparent-blue",
        imageUrl: "https://cdn.shopify.com/s/files/1/0211/2667/6580/files/IMG_20240509_20091874545544423_76f682f0-c7d9-4f1c-9308-9bb9b0b438d5.jpg?v=1776505005",
        isNew: true,
      },
      {
        title: "Firefly FFMN Electric Guitar Floyd Rose Tremolo (White Color)",
        url: "https://guitarsgarden.com/products/firefly-ffmn-electric-guitar-with-flamed-maple-top-white-color",
        imageUrl: "https://cdn.shopify.com/s/files/1/0211/2667/6580/files/IMG_20240509_2009187454554442_398252ce-61e2-49cf-80a8-9fbb9d9175cc.jpg?v=1758847706",
        isNew: false,
      },
    ];

    await sendStockAlertEmail(
      subscribers.map((s) => ({ name: s.name, email: s.email })),
      testProducts
    );

    const smsRecipients = subscribers
      .filter((s) => s.smsConsent && s.phone)
      .map((s) => ({ name: s.name, phone: s.phone! }));

    if (smsRecipients.length > 0) {
      await sendStockAlertSms(smsRecipients, testProducts);
    }

    return NextResponse.json({ emailsSent: subscribers.length, smsSent: smsRecipients.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
