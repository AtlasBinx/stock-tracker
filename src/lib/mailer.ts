import { Resend } from "resend";
import { PLANS, type PlanKey } from "@/lib/stripe";

const STORE_URL = "https://guitarsgarden.com";
const APP_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://stock-tracker-seven-delta.vercel.app";

export interface EmailRecipient {
  name: string;
  email: string;
}

export async function sendStockAddedEmail(
  recipients: EmailRecipient[],
  addedProducts: string[]
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || recipients.length === 0) return;

  // Instantiate lazily so missing key at build time doesn't crash
  const resend = new Resend(apiKey);
  const FROM = process.env.RESEND_FROM ?? "Guitars Garden Alerts <onboarding@resend.dev>";

  const productList = addedProducts.map((p) => `• ${p}`).join("\n");

  await Promise.allSettled(
    recipients.map((r) =>
      resend.emails.send({
        from: FROM,
        to: r.email,
        subject: "🎸 New stock added to Guitars Garden",
        text: [
          `Hi ${r.name},`,
          "",
          "New products have just been added to Guitars Garden:",
          "",
          productList,
          "",
          `View the store: ${STORE_URL}`,
          "",
          "You're receiving this because you signed up for stock alerts.",
          "Reply to this email to unsubscribe.",
        ].join("\n"),
        html: `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="margin:0 0 8px">🎸 New stock added</h2>
  <p style="margin:0 0 20px;color:#555">Hi ${r.name}, new products just landed on Guitars Garden:</p>
  <ul style="padding-left:20px;margin:0 0 24px">
    ${addedProducts.map((p) => `<li style="margin-bottom:6px">${p}</li>`).join("")}
  </ul>
  <a href="${STORE_URL}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600">
    View Guitars Garden →
  </a>
  <p style="margin-top:32px;font-size:12px;color:#999">
    Manage or cancel your subscription: <a href="${APP_URL}/account" style="color:#6366f1">${APP_URL}/account</a>
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
  const FROM = process.env.RESEND_FROM ?? "Guitars Garden Alerts <alerts@meridianrev.com>";

  const planConfig = PLANS[plan as PlanKey];
  const planName = planConfig?.name ?? plan;
  const renews = planConfig?.renews ?? false;
  const expiryLine = accessExpiresAt
    ? `Your access runs through <strong>${accessExpiresAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong> and will not auto-renew.`
    : `Your subscription renews monthly at $${amountPaid.toFixed(2)} until you cancel.`;

  await resend.emails.send({
    from: FROM,
    to: recipient.email,
    subject: `🎸 You're subscribed — Guitars Garden Alerts`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="margin:0 0 8px">🎸 You're subscribed!</h2>
  <p>Hi ${recipient.name}, welcome to Guitars Garden Stock Alerts.</p>
  <table style="width:100%;border-collapse:collapse;margin:20px 0;background:#f9f9f9;border-radius:8px">
    <tr><td style="padding:10px 14px;font-weight:600">Plan</td><td style="padding:10px 14px">${planName}</td></tr>
    <tr><td style="padding:10px 14px;font-weight:600">Amount paid</td><td style="padding:10px 14px">$${amountPaid.toFixed(2)}</td></tr>
    <tr><td style="padding:10px 14px;font-weight:600">Billing</td><td style="padding:10px 14px">${expiryLine}</td></tr>
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

export async function sendExpiryReminderEmail(
  recipient: EmailRecipient,
  plan: string,
  expiresAt: Date
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const resend = new Resend(apiKey);
  const FROM = process.env.RESEND_FROM ?? "Guitars Garden Alerts <alerts@meridianrev.com>";

  const planConfig = PLANS[plan as PlanKey];
  const planName = planConfig?.name ?? plan;
  const expiryDate = expiresAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  await resend.emails.send({
    from: FROM,
    to: recipient.email,
    subject: `Your Guitars Garden access expires on ${expiryDate}`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="margin:0 0 8px">🎸 Your access is ending soon</h2>
  <p>Hi ${recipient.name},</p>
  <p>Your <strong>${planName}</strong> access to Guitars Garden Stock Alerts ends on <strong>${expiryDate}</strong>.</p>
  <p>No charge happens automatically — this is just a heads up in case you'd like to continue receiving alerts.</p>
  <a href="${APP_URL}/signup" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;margin:16px 0">
    Renew my access →
  </a>
  <p style="font-size:12px;color:#999;margin-top:24px">
    If you don't renew, your access simply ends on ${expiryDate} with no further action needed.
    To stop these reminder emails, <a href="${APP_URL}/account" style="color:#6366f1">visit your account</a>.
  </p>
</body>
</html>`,
  });
}
