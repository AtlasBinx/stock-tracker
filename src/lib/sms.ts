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

function buildSmsMessages(
  products: { title: string; url: string; isNew: boolean }[],
  trialFooter?: string
): string[] {
  const hasNew = products.some((p) => p.isNew);
  const hasRestock = products.some((p) => !p.isNew);
  const intro = hasNew && hasRestock
    ? "New & restocked at Guitars Garden:"
    : hasNew
    ? "New guitars at Guitars Garden:"
    : "Back in stock at Guitars Garden:";

  const productLines = products.map((p) => `${p.isNew ? "NEW" : "RESTOCK"}: ${p.title}\n${p.url}`);
  const footer = trialFooter
    ? `\n\n${trialFooter}\n\nReply STOP to opt out.`
    : "\n\nReply STOP to opt out.";
  const prefix = `Guitar Stock Alert: ${intro}\n\n`;

  const chunks: string[][] = [];
  let current: string[] = [];
  for (const line of productLines) {
    const candidate = [...current, line];
    const body = prefix + candidate.join("\n\n") + footer;
    if (body.length > 1500 && current.length > 0) {
      chunks.push(current);
      current = [line];
    } else {
      current = candidate;
    }
  }
  if (current.length > 0) chunks.push(current);

  return chunks.map((chunk, i) => {
    const part = chunks.length > 1 ? ` (${i + 1}/${chunks.length})` : "";
    return `Guitar Stock Alert${part}: ${intro}\n\n${chunk.join("\n\n")}${footer}`;
  });
}

export async function sendStockAlertSms(
  paidRecipients: SmsRecipient[],
  trialRecipients: SmsRecipient[],
  products: { title: string; url: string; isNew: boolean }[],
  upgradeUrl: string
): Promise<void> {
  if (!getTwilioConfig() || products.length === 0) return;
  if (paidRecipients.length === 0 && trialRecipients.length === 0) return;

  const paidMessages = buildSmsMessages(products);
  const trialMessages = buildSmsMessages(
    products,
    `That was your free alert. Upgrade to keep getting notified: ${upgradeUrl}`
  );

  await Promise.allSettled([
    ...paidRecipients.flatMap((r) => paidMessages.map((body) => sendSms(r.phone, body))),
    ...trialRecipients.flatMap((r) => trialMessages.map((body) => sendSms(r.phone, body))),
  ]);
}

