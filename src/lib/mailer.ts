import { Resend } from "resend";

const STORE_URL = "https://guitarsgarden.com";

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
    You signed up for stock alerts. Reply to unsubscribe.
  </p>
</body>
</html>`,
      })
    )
  );
}
