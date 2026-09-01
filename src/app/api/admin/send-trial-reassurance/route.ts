import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest, unauthorizedResponse } from "@/lib/auth";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

function escapeHtml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorizedResponse();

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "RESEND_API_KEY not set" }, { status: 500 });

  const resend = new Resend(apiKey);
  const FROM = process.env.RESEND_FROM ?? "Guitar Stock Alert <alerts@guitarstockalert.com>";
  const APP_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://guitarstockalert.com";

  const now = new Date();
  const subscribers = await db.subscriber.findMany({
    where: { plan: "trial", accessExpiresAt: { not: null, gt: now } },
    select: { name: true, email: true, accessExpiresAt: true },
  });

  const results: { email: string; status: string }[] = [];

  await Promise.allSettled(
    subscribers.map(async (s) => {
      const expiryFormatted = s.accessExpiresAt!.toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      });

      const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a1a;background:#fff">
  <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">&#127928; Guitar Stock Alert</p>
  <h2 style="margin:0 0 12px;font-size:22px;font-weight:700">Your free trial is still going strong.</h2>
  <p style="font-size:15px;color:#333;line-height:1.6;">Hi ${escapeHtml(s.name)},</p>
  <p style="font-size:15px;color:#333;line-height:1.6;">Just a quick note from us — we recently updated how our free trial works for new signups, and we want to make sure there's no confusion on your end.</p>
  <p style="font-size:15px;color:#333;line-height:1.6;"><strong>Your trial is completely unaffected.</strong> You signed up under our original 30-day trial and that hasn't changed. You'll keep receiving stock alerts every time Guitars Garden drops something new, right through your trial period.</p>
  <div style="margin:24px 0;padding:16px 20px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;">
    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:0.05em">Your trial is active through</p>
    <p style="margin:0;font-size:20px;font-weight:800;color:#166534;">${escapeHtml(expiryFormatted)}</p>
  </div>
  <p style="font-size:15px;color:#333;line-height:1.6;">No action needed — just sit back and we'll alert you the second something new hits the store.</p>
  <p style="font-size:15px;color:#333;line-height:1.6;">If you have any questions at all, just reply to this email. We're happy to help.</p>
  <p style="font-size:15px;color:#333;line-height:1.6;margin-top:24px;">Thanks for being one of our first subscribers,<br><strong>Guitar Stock Alert</strong></p>
  <p style="margin-top:32px;font-size:12px;color:#999">
    Manage your account: <a href="${APP_URL}/account" style="color:#6366f1">${APP_URL}/account</a>
  </p>
</body>
</html>`;

      const r = await resend.emails.send({
        from: FROM,
        to: s.email,
        subject: "🎸 Your free trial is still active — no changes to your account",
        html,
      });

      results.push({ email: s.email, status: r.error ? `error: ${r.error.message}` : "sent" });
    })
  );

  return NextResponse.json({ total: subscribers.length, results });
}
