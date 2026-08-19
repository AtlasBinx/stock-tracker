import { Resend } from "resend";
import { PLANS, type PlanKey } from "@/lib/stripe";
import type { ProductAlert } from "@/lib/guitarsgarden";

const STORE_URL = "https://guitarsgarden.com";
const APP_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://guitarstockalert.com";

export interface EmailRecipient {
  name: string;
  email: string;
}

function escapeHtml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function sendStockAlertEmail(
  recipients: EmailRecipient[],
  products: ProductAlert[]
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || recipients.length === 0 || products.length === 0) return;

  const resend = new Resend(apiKey);
  const FROM = process.env.RESEND_FROM ?? "Guitar Stock Alert <alerts@guitarstockalert.com>";

  const hasNew = products.some((p) => p.isNew);
  const hasRestock = products.some((p) => !p.isNew);
  const subject = hasNew && hasRestock
    ? "New & restocked guitars at Guitars Garden"
    : hasNew
    ? "New guitars just dropped at Guitars Garden"
    : "Guitars back in stock at Guitars Garden";

  const productCardsHtml = products.map((p) => `
    <a href="${escapeHtml(p.url)}" style="display:block;text-decoration:none;color:inherit;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:12px">
      ${p.imageUrl ? `<img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.title)}" style="width:100%;max-height:220px;object-fit:cover;display:block">` : ""}
      <div style="padding:12px 16px">
        <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:${p.isNew ? "#059669" : "#2563eb"}">${p.isNew ? "NEW" : "BACK IN STOCK"}</p>
        <p style="margin:0;font-size:14px;font-weight:600;color:#111">${escapeHtml(p.title)}</p>
        <p style="margin:6px 0 0;font-size:13px;color:#4f46e5;font-weight:500">View product →</p>
      </div>
    </a>`).join("");

  const productTextList = products.map((p) =>
    `${p.isNew ? "[NEW]" : "[RESTOCK]"} ${p.title}\n${p.url}`
  ).join("\n\n");

  await Promise.allSettled(
    recipients.map((r) =>
      resend.emails.send({
        from: FROM,
        to: r.email,
        subject,
        text: [
          `Hi ${r.name},`,
          "",
          "Here's what just changed at Guitars Garden:",
          "",
          productTextList,
          "",
          `View the store: ${STORE_URL}`,
          "",
          `Manage your subscription: ${APP_URL}/account`,
        ].join("\n"),
        html: `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:24px;color:#1a1a1a;background:#fff">
  <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Guitar Stock Alert</p>
  <h2 style="margin:0 0 6px;font-size:22px;font-weight:700">${escapeHtml(subject)}</h2>
  <p style="margin:0 0 24px;color:#555;font-size:14px">Hi ${escapeHtml(r.name)}, here's what just changed at Guitars Garden:</p>
  ${productCardsHtml}
  <a href="${STORE_URL}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;margin-top:8px;font-size:14px">
    View full store →
  </a>
  <p style="margin-top:32px;font-size:12px;color:#999">
    Manage your subscription: <a href="${APP_URL}/account" style="color:#6366f1">${APP_URL}/account</a>
  </p>
</body>
</html>`,
      })
    )
  );
}


export async function sendPurchaseConfirmationEmail(
  recipient: EmailRecipient,
  plan: string,
  amountPaid: number,
  accessExpiresAt: Date | null
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const resend = new Resend(apiKey);
  const FROM = process.env.RESEND_FROM ?? "Guitar Stock Alert <alerts@guitarstockalert.com>";

  const planConfig = PLANS[plan as PlanKey];
  const isTrial = plan === "trial";
  const planName = isTrial ? "Free 30-Day Trial" : (planConfig?.name ?? plan);
  const expiryLine = isTrial && accessExpiresAt
    ? `Your free trial runs through <strong>${accessExpiresAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong>. To keep getting alerts after that, upgrade to an annual plan for just $14.99/year.`
    : accessExpiresAt
    ? `Your access runs through <strong>${accessExpiresAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong> and will not auto-renew.`
    : `Your subscription renews monthly at $${amountPaid.toFixed(2)} until you cancel.`;

  await resend.emails.send({
    from: FROM,
    to: recipient.email,
    subject: isTrial ? `🎸 Your free trial is active — Guitar Stock Alert` : `🎸 You're subscribed — Guitar Stock Alert`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="margin:0 0 8px">${isTrial ? "🎸 Your free trial is active!" : "🎸 You're subscribed!"}</h2>
  <p>Hi ${recipient.name}, welcome to Guitar Stock Alert.</p>
  <table style="width:100%;border-collapse:collapse;margin:20px 0;background:#f9f9f9;border-radius:8px">
    <tr><td style="padding:10px 14px;font-weight:600">Plan</td><td style="padding:10px 14px">${planName}</td></tr>
    ${!isTrial ? `<tr><td style="padding:10px 14px;font-weight:600">Amount paid</td><td style="padding:10px 14px">$${amountPaid.toFixed(2)}</td></tr>` : ""}
    <tr><td style="padding:10px 14px;font-weight:600">Access</td><td style="padding:10px 14px">${expiryLine}</td></tr>
  </table>
  <p>We'll email you every time new products are added to <a href="${STORE_URL}">Guitars Garden</a>.</p>
  <p><strong>To cancel or manage your subscription</strong> — visit the self-service portal at any time:</p>
  <a href="${APP_URL}/account" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:600;margin:8px 0">
    Manage my subscription →
  </a>
  <p style="margin-top:32px;font-size:12px;color:#999">
    Cancellation is always online and self-service — no email or phone call required.
  </p>
</body>
</html>`,
  });
}

export async function sendCancellationConfirmationEmail(
  recipient: EmailRecipient,
  plan: string,
  accessEndsAt: Date
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const resend = new Resend(apiKey);
  const FROM = process.env.RESEND_FROM ?? "Guitar Stock Alert <alerts@guitarstockalert.com>";

  const planConfig = PLANS[plan as PlanKey];
  const planName = planConfig?.name ?? plan;
  const endDate = accessEndsAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  await resend.emails.send({
    from: FROM,
    to: recipient.email,
    subject: `Your Guitar Stock Alert subscription has been cancelled`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="margin:0 0 8px">🎸 Subscription cancelled</h2>
  <p>Hi ${recipient.name},</p>
  <p>Your <strong>${planName}</strong> subscription has been cancelled. You still have full access to Guitar Stock Alert alerts until:</p>
  <p style="font-size:20px;font-weight:700;text-align:center;padding:16px;background:#f5f5f5;border-radius:8px;margin:20px 0">${endDate}</p>
  <p>After that date, you'll stop receiving stock alerts and no further charges will occur.</p>
  <p>Changed your mind? You can resubscribe any time before or after your access ends:</p>
  <a href="${APP_URL}/signup" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;margin:8px 0">
    Resubscribe →
  </a>
  <p style="font-size:12px;color:#999;margin-top:32px">
    Questions? Reply to this email or visit <a href="${APP_URL}/account" style="color:#6366f1">your account page</a>.
  </p>
</body>
</html>`,
  });
}

export async function sendTrialExpiredEmail(
  recipient: EmailRecipient
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const resend = new Resend(apiKey);
  const FROM = process.env.RESEND_FROM ?? "Guitar Stock Alert <alerts@guitarstockalert.com>";

  await resend.emails.send({
    from: FROM,
    to: recipient.email,
    subject: `Your Guitar Stock Alert trial has ended — stay in the loop for $14.99/yr`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="margin:0 0 8px">🎸 Your free trial has ended</h2>
  <p>Hi ${escapeHtml(recipient.name)},</p>
  <p>Your 30-day free trial of Guitar Stock Alert has expired and your alerts have been paused.</p>
  <p>Guitars Garden drops new stock regularly — especially heading into the holidays. If you want back in before the next drop, you can lock in a full year for just <strong>$14.99</strong>. That's $1.25 a month to never miss a deal again.</p>
  <a href="${APP_URL}/signup" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:15px;margin:16px 0">
    Stay in the loop — $14.99/year →
  </a>
  <p style="font-size:13px;color:#555;margin-top:8px">
    Not ready for a year? Grab a <a href="${APP_URL}/signup" style="color:#4f46e5">30-day pass for $5.99</a> and jump back in anytime.
  </p>
  <p style="font-size:12px;color:#999;margin-top:32px">
    No action needed if you'd rather not continue — you won't be charged anything.
  </p>
</body>
</html>`,
  });
}

export async function sendExpiryReminderEmail(
  recipient: EmailRecipient,
  plan: string,
  expiresAt: Date
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const resend = new Resend(apiKey);
  const FROM = process.env.RESEND_FROM ?? "Guitar Stock Alert <alerts@guitarstockalert.com>";

  const planConfig = PLANS[plan as PlanKey];
  const isTrial = plan === "trial";
  const planName = isTrial ? "Free Trial" : (planConfig?.name ?? plan);
  const expiryDate = expiresAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  await resend.emails.send({
    from: FROM,
    to: recipient.email,
    subject: isTrial ? `Your free trial ends in 3 days — keep your alerts for $14.99/yr` : `Your Guitar Stock Alert access ends in 3 days`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="margin:0 0 8px">${isTrial ? "Your free trial ends in 3 days" : "Your access ends in 3 days"}</h2>
  <p>Hi ${recipient.name},</p>
  ${isTrial
    ? `<p>Your free trial expires on:</p>`
    : `<p>Just a heads up — your <strong>${planName}</strong> access to Guitar Stock Alert expires on:</p>`
  }
  <p style="font-size:20px;font-weight:700;text-align:center;padding:16px;background:#f5f5f5;border-radius:8px;margin:20px 0">${expiryDate}</p>
  ${isTrial
    ? `<p>After that you'll stop receiving alerts when new guitars drop at Guitars Garden. Lock in a full year of alerts for just <strong>$14.99</strong> — that's $1.25/month.</p>
       <a href="${APP_URL}/signup" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;margin:8px 0">
         Keep my alerts — $14.99/year →
       </a>
       <p style="font-size:13px;color:#555;margin-top:12px">Or grab a 30-day pass for $5.99 if you're not ready to commit.</p>`
    : `<p>After that date you'll stop receiving stock alerts from us. Resubscribe to keep getting alerts:</p>
       <a href="${APP_URL}/signup" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;margin:8px 0">
         Resubscribe →
       </a>`
  }
  <p style="font-size:12px;color:#999;margin-top:32px">
    If you don't upgrade, your access simply ends on ${expiryDate} — no action needed and no charges.
    <a href="${APP_URL}/account" style="color:#6366f1">View your account →</a>
  </p>
</body>
</html>`,
  });
}

export async function sendAffiliateWelcomeEmail(
  recipient: EmailRecipient,
  code: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const resend = new Resend(apiKey);
  const FROM = process.env.RESEND_FROM ?? "Guitar Stock Alert <alerts@guitarstockalert.com>";

  const signupUrl = `${APP_URL}/signup?ref=${code}`;
  const creatorKitUrl = `${APP_URL}/creators/${code}`;

  await resend.emails.send({
    from: FROM,
    to: recipient.email,
    subject: `🎸 Welcome to Guitar Stock Alert — your creator kit is ready`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="margin:0 0 8px">🎸 Welcome, ${escapeHtml(recipient.name)}!</h2>
  <p>We've set you up with everything you need to start earning. Your creator account is live — you have <strong>free, permanent access</strong> to Guitar Stock Alert and will receive real-time alerts whenever Guitars Garden drops new stock, just like your audience will.</p>

  <table style="width:100%;border-collapse:collapse;margin:20px 0;background:#f9f9f9;border-radius:8px">
    <tr><td style="padding:10px 14px;font-weight:600;white-space:nowrap">Your code</td><td style="padding:10px 14px;font-family:monospace;font-size:16px;font-weight:700">${escapeHtml(code)}</td></tr>
    <tr><td style="padding:10px 14px;font-weight:600;white-space:nowrap">Your link</td><td style="padding:10px 14px"><a href="${signupUrl}" style="color:#4f46e5;word-break:break-all">${signupUrl}</a></td></tr>
    <tr><td style="padding:10px 14px;font-weight:600;white-space:nowrap">Access</td><td style="padding:10px 14px">Free · Permanent while your code is active</td></tr>
    <tr><td style="padding:10px 14px;font-weight:600;white-space:nowrap">Bounty</td><td style="padding:10px 14px">$5 per annual · $2 per 30-day pass</td></tr>
    <tr><td style="padding:10px 14px;font-weight:600;white-space:nowrap">Payouts</td><td style="padding:10px 14px">Biweekly · no minimum · your preferred method</td></tr>
  </table>

  <h3 style="margin:24px 0 8px;font-size:16px">How it works</h3>
  <ol style="margin:0;padding-left:20px;line-height:1.8;color:#333">
    <li>Share your link — your audience signs up and gets <strong>30 free days</strong>, no credit card required</li>
    <li>At the end of their trial, if they choose a plan, you earn your bounty — <strong>30-day attribution window</strong></li>
    <li>You'll start receiving stock alerts yourself right away</li>
  </ol>

  <h3 style="margin:24px 0 8px;font-size:16px">Your creator kit</h3>
  <p style="margin:0 0 12px">Your kit has everything ready to go — no need to write anything from scratch:</p>
  <ul style="margin:0 0 16px;padding-left:20px;line-height:1.8;color:#333">
    <li>Copy-paste video scripts (30s and 60s cuts)</li>
    <li>YouTube description blurb, end screen script, and community post</li>
    <li>Instagram caption and email template</li>
    <li>Talking points and FAQ answers for any questions your audience might have</li>
  </ul>
  <a href="${creatorKitUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:15px;margin:4px 0">
    Open your creator kit →
  </a>

  <p style="margin-top:28px;color:#555">Questions? Just reply to this email — we're happy to help.</p>
  <p style="margin-top:32px;font-size:12px;color:#999">
    Guitar Stock Alert · <a href="${APP_URL}" style="color:#6366f1">guitarstockalert.com</a>
  </p>
</body>
</html>`,
  });
}
