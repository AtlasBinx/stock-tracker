/**
 * SMS delivery via Twilio.
 * All functions no-op gracefully if TWILIO_* env vars are not set,
 * so the app works fine before A2P 10DLC registration is complete.
 */

export interface SmsRecipient {
  name: string;
  phone: string;
}

function getTwilioConfig() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) return null;
  return { sid, token, from };
}

async function sendSms(to: string, body: string): Promise<void> {
  const config = getTwilioConfig();
  if (!config) return; // SMS not configured yet — silent no-op

  const url = `https://api.twilio.com/2010-04-01/Accounts/${config.sid}/Messages.json`;
  const creds = Buffer.from(`${config.sid}:${config.token}`).toString("base64");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: config.from, Body: body }).toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[SMS] Failed to ${to}:`, err);
  }
}

export async function sendSmsOptInConfirmation(phone: string): Promise<void> {
  const config = getTwilioConfig();
  if (!config) return;

  const body =
    "Guitars Garden Alerts: You're now subscribed to stock alerts. " +
    "Msg frequency varies. Msg & data rates may apply. " +
    "Reply STOP to cancel, HELP for help.";

  await sendSms(phone, body);
}

export async function sendStockAddedSms(
  recipients: SmsRecipient[],
  addedProducts: string[]
): Promise<void> {
  if (!getTwilioConfig() || recipients.length === 0) return;

  const storeUrl = "https://guitarsgarden.com";
  const list = addedProducts.slice(0, 3).join(", ");
  const more = addedProducts.length > 3 ? ` (+${addedProducts.length - 3} more)` : "";
  const body = `🎸 New stock at Guitars Garden: ${list}${more}\n${storeUrl}\nReply STOP to opt out.`;

  await Promise.allSettled(recipients.map((r) => sendSms(r.phone, body)));
}

export async function sendBackInStockSms(
  recipients: SmsRecipient[],
  products: string[]
): Promise<void> {
  if (!getTwilioConfig() || recipients.length === 0) return;

  const storeUrl = "https://guitarsgarden.com";
  const list = products.slice(0, 3).join(", ");
  const more = products.length > 3 ? ` (+${products.length - 3} more)` : "";
  const body = `🎸 Back in stock at Guitars Garden: ${list}${more}\n${storeUrl}\nReply STOP to opt out.`;

  await Promise.allSettled(recipients.map((r) => sendSms(r.phone, body)));
}
