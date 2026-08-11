import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Resend } from "resend";
import { toE164 } from "@/lib/sms";
import { isAdminRequest, unauthorizedResponse } from "@/lib/auth";

export const dynamic = "force-dynamic";

function escapeHtml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorizedResponse();
  try {
    const { subject, message, sendEmail, sendSms, recipientIds } = await req.json();

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
    }
    if (!sendEmail && !sendSms) {
      return NextResponse.json({ error: "Select at least one channel" }, { status: 400 });
    }

    const subscribers = await db.subscriber.findMany({
      where: {
        active: true,
        planStatus: "active",
        OR: [{ accessExpiresAt: null }, { accessExpiresAt: { gt: new Date() } }],
        ...(recipientIds?.length ? { id: { in: recipientIds } } : {}),
      },
    });

    if (subscribers.length === 0) {
      return NextResponse.json({ error: "No active subscribers" }, { status: 400 });
    }

    let emailsSent = 0;
    let smsSent = 0;

    if (sendEmail) {
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        const resend = new Resend(apiKey);
        const FROM = process.env.RESEND_FROM ?? "Guitar Stock Alert <alerts@guitarstockalert.com>";
        const APP_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://guitarstockalert.com";

        await Promise.allSettled(
          subscribers.map((s) =>
            resend.emails.send({
              from: FROM,
              to: s.email,
              subject,
              html: `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a1a">
  <p>Hi ${s.name},</p>
  <div style="white-space:pre-wrap;line-height:1.6">${escapeHtml(message).replace(/\n/g, "<br>")}</div>
  <p style="margin-top:32px;font-size:12px;color:#999">
    Manage your subscription: <a href="${APP_URL}/account" style="color:#6366f1">${APP_URL}/account</a>
  </p>
</body>
</html>`,
              text: `Hi ${s.name},\n\n${message}\n\nManage your subscription: ${APP_URL}/account`,
            })
          )
        );
        emailsSent = subscribers.length;
      }
    }

    if (sendSms) {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const token = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_FROM_NUMBER;

      if (sid && token && from) {
        const smsRecipients = subscribers.filter((s) => s.smsConsent && s.phone);
        const creds = btoa(`${sid}:${token}`);
        const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
        const body = `Guitar Stock Alert: ${message}\nReply STOP to opt out.`;

        await Promise.allSettled(
          smsRecipients.map((s) =>
            fetch(url, {
              method: "POST",
              headers: { Authorization: `Basic ${creds}`, "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({ To: toE164(s.phone!), From: from, Body: body }).toString(),
            })
          )
        );
        smsSent = smsRecipients.length;
      }
    }

    return NextResponse.json({ emailsSent, smsSent });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
