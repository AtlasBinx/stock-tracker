import { db } from "./db";
import { sendStockAddedEmail, sendBackInStockEmail } from "./mailer";
import { sendStockAddedSms, sendBackInStockSms } from "./sms";

const STORE_URL = "https://guitarsgarden.com/products.json?limit=250";

interface ShopifyVariant {
  id: number;
  title: string;
  sku: string;
  price: string;
  available: boolean;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  variants: ShopifyVariant[];
}

interface ShopifyResponse {
  products: ShopifyProduct[];
}

export interface SyncSummary {
  totalProducts: number;
  added: string[];
  removed: string[];
  wentInStock: string[];
  wentOutOfStock: string[];
  error?: string;
}

async function fetchProducts(): Promise<ShopifyProduct[]> {
  const res = await fetch(STORE_URL, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8_000),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Shopify API returned ${res.status}`);

  const data: ShopifyResponse = await res.json();
  return data.products;
}

export async function syncGuitarsGarden(): Promise<SyncSummary> {
  let liveProducts: ShopifyProduct[];

  try {
    liveProducts = await fetchProducts();
  } catch (err) {
    // Log the failed attempt so the dashboard timestamp still updates
    await db.syncRun.create({
      data: { totalProducts: 0, added: 0, removed: 0, wentInStock: 0, wentOutOfStock: 0 },
    });
    return {
      totalProducts: 0,
      added: [],
      removed: [],
      wentInStock: [],
      wentOutOfStock: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // Write the sync record immediately after fetching so the timestamp is saved
  // even if Vercel's function timeout cuts the rest of the work short.
  await db.syncRun.create({
    data: { totalProducts: liveProducts.length, added: 0, removed: 0, wentInStock: 0, wentOutOfStock: 0 },
  });

  // Build a map of what the store has right now
  const liveMap = new Map<string, ShopifyProduct>();
  for (const p of liveProducts) {
    liveMap.set(String(p.id), p);
  }

  // Load everything we have in our DB
  const dbProducts = await db.guitarProduct.findMany();
  const dbMap = new Map(dbProducts.map((p) => [p.shopifyId, p]));

  const added: string[] = [];
  const removed: string[] = [];
  const wentInStock: string[] = [];
  const wentOutOfStock: string[] = [];

  // --- Check live products against DB ---
  for (const [shopifyId, live] of liveMap) {
    const variant = live.variants[0]; // single-variant products
    const liveAvailable = variant?.available ?? false;
    const liveSku = variant?.sku ?? null;
    const livePrice = variant?.price ?? null;

    const existing = dbMap.get(shopifyId);

    if (!existing) {
      // Brand new product — never seen before
      const created = await db.guitarProduct.create({
        data: {
          shopifyId,
          title: live.title,
          handle: live.handle,
          sku: liveSku,
          price: livePrice,
          available: liveAvailable,
          active: true,
        },
      });

      await db.guitarEvent.create({
        data: { productId: created.id, type: "ADDED" },
      });

      added.push(live.title);
    } else {
      // Product exists — check for changes
      const updates: Record<string, unknown> = { lastSeen: new Date() };
      const events: ("WENT_IN_STOCK" | "WENT_OUT_OF_STOCK")[] = [];

      if (!existing.active) {
        // It was marked removed but it's back
        updates.active = true;
        added.push(live.title);
        events.push("WENT_IN_STOCK");
      }

      if (existing.available !== liveAvailable) {
        updates.available = liveAvailable;
        if (liveAvailable) {
          wentInStock.push(live.title);
          events.push("WENT_IN_STOCK");
        } else {
          wentOutOfStock.push(live.title);
          events.push("WENT_OUT_OF_STOCK");
        }
      }

      if (existing.title !== live.title) updates.title = live.title;
      if (existing.price !== livePrice) updates.price = livePrice;
      if (existing.sku !== liveSku) updates.sku = liveSku;

      await db.guitarProduct.update({
        where: { id: existing.id },
        data: updates,
      });

      for (const type of events) {
        await db.guitarEvent.create({
          data: { productId: existing.id, type },
        });
      }
    }
  }

  // --- Check DB products that are no longer in the live feed ---
  for (const [shopifyId, dbProduct] of dbMap) {
    if (!liveMap.has(shopifyId) && dbProduct.active) {
      await db.guitarProduct.update({
        where: { id: dbProduct.id },
        data: { active: false },
      });
      await db.guitarEvent.create({
        data: { productId: dbProduct.id, type: "REMOVED" },
      });
      removed.push(dbProduct.title);
    }
  }

  // Send alerts — only to active paid subscribers
  if (added.length > 0 || wentInStock.length > 0) {
    const now = new Date();
    const subscribers = await db.subscriber.findMany({
      where: {
        active: true,
        planStatus: "active",
        OR: [
          { accessExpiresAt: null },
          { accessExpiresAt: { gt: now } },
        ],
      },
      select: { name: true, email: true, phone: true, smsConsent: true },
    });

    if (subscribers.length > 0) {
      const smsRecipients = subscribers
        .filter((s) => s.smsConsent && s.phone)
        .map((s) => ({ name: s.name, phone: s.phone! }));

      if (added.length > 0) {
        await sendStockAddedEmail(subscribers, added);
        if (smsRecipients.length > 0) await sendStockAddedSms(smsRecipients, added);
      }
      if (wentInStock.length > 0) {
        await sendBackInStockEmail(subscribers, wentInStock);
        if (smsRecipients.length > 0) await sendBackInStockSms(smsRecipients, wentInStock);
      }
    }
  }

  return {
    totalProducts: liveProducts.length,
    added,
    removed,
    wentInStock,
    wentOutOfStock,
  };
}
