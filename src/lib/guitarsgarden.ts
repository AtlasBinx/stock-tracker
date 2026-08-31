import { db } from "./db";
import { sendStockAlertEmail } from "./mailer";
import { sendStockAlertSms } from "./sms";

const STORE_URL = "https://guitarsgarden.com/products.json?limit=250";

interface ShopifyVariant {
  id: number;
  title: string;
  sku: string;
  price: string;
  available: boolean;
}

interface ShopifyImage {
  src: string;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
}

interface ShopifyResponse {
  products: ShopifyProduct[];
}

export interface ProductAlert {
  title: string;
  url: string;
  imageUrl: string | null;
  isNew: boolean; // true = newly added, false = back in stock
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
  const alertProducts: ProductAlert[] = [];

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
      alertProducts.push({
        title: live.title,
        url: `https://guitarsgarden.com/products/${live.handle}`,
        imageUrl: live.images[0]?.src ?? null,
        isNew: true,
      });
    } else {
      // Product exists — check for changes
      const updates: Record<string, unknown> = { lastSeen: new Date() };
      const events: ("WENT_IN_STOCK" | "WENT_OUT_OF_STOCK")[] = [];

      if (!existing.active) {
        // It was marked removed but it's back
        updates.active = true;
        added.push(live.title);
        events.push("WENT_IN_STOCK");
        alertProducts.push({
          title: live.title,
          url: `https://guitarsgarden.com/products/${live.handle}`,
          imageUrl: live.images[0]?.src ?? null,
          isNew: true,
        });
      }

      if (existing.available !== liveAvailable) {
        updates.available = liveAvailable;
        if (liveAvailable) {
          wentInStock.push(live.title);
          events.push("WENT_IN_STOCK");
          alertProducts.push({
            title: live.title,
            url: `https://guitarsgarden.com/products/${live.handle}`,
            imageUrl: live.images[0]?.src ?? null,
            isNew: false,
          });
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

  // Deduplicate alertProducts by URL — if same product appears as both NEW and RESTOCK, keep NEW
  const alertMap = new Map<string, ProductAlert>();
  for (const p of alertProducts) {
    const existing = alertMap.get(p.url);
    if (!existing || p.isNew) alertMap.set(p.url, p);
  }
  const deduped = Array.from(alertMap.values());

  // Send one combined alert for all new + restocked products
  if (deduped.length > 0) {
    const now = new Date();

    // Paid/affiliate subscribers with active access
    const paidSubscribers = await db.subscriber.findMany({
      where: {
        active: true,
        planStatus: "active",
        plan: { not: "trial" },
        OR: [
          { accessExpiresAt: null },
          { accessExpiresAt: { gt: now } },
        ],
      },
      select: { id: true, name: true, email: true, phone: true, smsConsent: true },
    });

    // Trial subscribers who haven't used their one free alert yet
    const freeTrialSubscribers = await db.subscriber.findMany({
      where: {
        active: true,
        plan: "trial",
        freeAlertUsed: false,
      },
      select: { id: true, name: true, email: true, phone: true, smsConsent: true },
    });

    const allRecipients = [...paidSubscribers, ...freeTrialSubscribers];

    if (allRecipients.length > 0) {
      const smsRecipients = allRecipients
        .filter((s) => s.smsConsent && s.phone)
        .map((s) => ({ name: s.name, phone: s.phone! }));

      await sendStockAlertEmail(paidSubscribers, freeTrialSubscribers, deduped);
      if (smsRecipients.length > 0) await sendStockAlertSms(smsRecipients, deduped);

      // Mark free trial subscribers as having used their one alert
      if (freeTrialSubscribers.length > 0) {
        await db.subscriber.updateMany({
          where: { id: { in: freeTrialSubscribers.map((s) => s.id) } },
          data: { freeAlertUsed: true },
        });
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
