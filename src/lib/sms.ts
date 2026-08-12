/**
 * SMS delivery via Twilio.
 * All functions no-op gracefully if TWILIO_* env vars are not set,
 * so the app works fine before A2P 10DLC registration is complete.
 */

export interface SmsRecipient {
  name: string;
  phone: string;
}

function stripBom(s: string) {
  return s.replace(/^﻿/, "").trim();
}

function getTwilioConfig() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) return null;
  return { sid: stripBom(sid), token: stripBom(token), from: stripBom(from) };
}

export function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return `+${digits}`;
}

async function sendSms(to: string, body: string): Promise<void> {
  const config = getTwilioConfig();
  if (!config) return; // SMS not configured yet — silent no-op
  to = toE164(to);

  const url = `https://api.twilio.com/2010-04-01/Accounts/${config.sid}/Messages.json`;
  const creds = btoa(`${config.sid}:${config.token}`);

  try {
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
      console.error(`[SMS] Failed to ${to} (${res.status}):`, err);
    }
  } catch (err) {
    console.error(`[SMS] Fetch error to ${to}:`, err);
  }
}

export async function sendSmsOptInConfirmation(phone: string): Promise<void> {
  const config = getTwilioConfig();
  if (!config) return;

  const body =
    "Guitar Stock Alert: You're now subscribed to stock alerts. " +
    "Msg frequency varies. Msg & data rates may apply. " +
    "Reply STOP to cancel, HELP for help.";

  await sendSms(phone, body);
}

export async function sendStockAlertSms(
  recipients: SmsRecipient[],
  products: { title: string; url: string; isNew: boolean }[]
): Promise<void> {
  if (!getTwilioConfig() || recipients.length === 0 || products.length === 0) return;

  const hasNew = products.some((p) => p.isNew);
  const hasRestock = products.some((p) => !p.isNew);
  const intro = hasNew && hasRestock
    ? "New & restocked at Guitars Garden:"
    : hasNew
    ? "New guitars at Guitars Garden:"
    : "Back in stock at Guitars Garden:";

  // List up to 3 products with direct links
  const lines = products.slice(0, 3).map((p) =>
    `${p.isNew ? "NEW" : "RESTOCK"}: ${p.title}\n${p.url}`
  );
  const more = products.length > 3 ? `\n+${products.length - 3} more at https://guitarsgarden.com` : "";

  const body = `Guitar Stock Alert: ${intro}\n\n${lines.join("\n\n")}${more}\n\nReply STOP to opt out.`;

  await Promise.allSettled(recipients.map((r) => sendSms(r.phone, body)));
}

// Keep old names as aliases so existing imports don't break
export const sendStockAddedSms = sendStockAlertSms as unknown as (r: SmsRecipient[], p: string[]) => Promise<void>;
export const sendBackInStockSms = sendStockAlertSms as unknown as (r: SmsRecipient[], p: string[]) => Promise<void>;
