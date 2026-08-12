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

// Keep old names as aliases so test-email route still compiles during transition
export const sendBackInStockEmail = sendStockAlertEmail as unknown as (r: EmailRecipient[], p: string[]) => Promise<void>;
export const sendStockAddedEmail = sendStockAlertEmail as unknown as (r: EmailRecipient[], p: string[]) => Promise<void>;

export async function sendStockAddedEmail(
  recipients: EmailRecipient[],
  addedProducts: string[]
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || recipients.length === 0) return;

  const resend = new Resend(apiKey);
  const FROM = process.env.RESEND_FROM ?? "Guitar Stock Alert <onboarding@resend.dev>";

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
  const FROM = process.env.RESEND_FROM ?? "Guitar Stock Alert <alerts@guitarstockalert.com>";

  const planConfig = PLANS[plan as PlanKey];
  const planName = planConfig?.name ?? plan;
  const expiryLine = accessExpiresAt
    ? `Your access runs through <strong>${accessExpiresAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong> and will not auto-renew.`
    : `Your subscription renews monthly at $${amountPaid.toFixed(2)} until you cancel.`;

  await resend.emails.send({
    from: FROM,
    to: recipient.email,
    subject: `🎸 You're subscribed — Guitar Stock Alert`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="margin:0 0 8px">🎸 You're subscribed!</h2>
  <p>Hi ${recipient.name}, welcome to Guitar Stock Alert.</p>
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
  const planName = planConfig?.name ?? plan;
  const expiryDate = expiresAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  await resend.emails.send({
    from: FROM,
    to: recipient.email,
    subject: `Your Guitar Stock Alert access ends in 3 days`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="margin:0 0 8px">Your access ends in 3 days</h2>
  <p>Hi ${recipient.name},</p>
  <p>Just a heads up — your <strong>${planName}</strong> access to Guitar Stock Alert expires on:</p>
  <p style="font-size:20px;font-weight:700;text-align:center;padding:16px;background:#f5f5f5;border-radius:8px;margin:20px 0">${expiryDate}</p>
  <p>After that date you'll stop receiving stock alerts from us. If you'd like to keep getting alerts when new guitars hit the store, you can resubscribe now:</p>
  <a href="${APP_URL}/signup" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;margin:8px 0">
    Resubscribe →
  </a>
  <p style="font-size:12px;color:#999;margin-top:32px">
    If you don't renew, your access simply ends on ${expiryDate} — no action needed and no further charges.
    <a href="${APP_URL}/account" style="color:#6366f1">View your account →</a>
  </p>
</body>
</html>`,
  });
}
