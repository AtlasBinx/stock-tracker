import { db } from "./db";
import { sendStockAddedEmail } from "./mailer";

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
    signal: AbortSignal.timeout(20_000),
    // Skip cache so we always get live data
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
    return {
      totalProducts: 0,
      added: [],
      removed: [],
      wentInStock: [],
      wentOutOfStock: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }

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

  // Send email alerts if anything was added — only to active paid subscribers
  if (added.length > 0) {
    const now = new Date();
    const subscribers = await db.subscriber.findMany({
      where: {
        active: true,
        planStatus: "active",
        OR: [
          { accessExpiresAt: null },           // monthly (no expiry)
          { accessExpiresAt: { gt: now } },    // prepaid with future expiry
        ],
      },
      select: { name: true, email: true },
    });
    if (subscribers.length > 0) {
      await sendStockAddedEmail(subscribers, added);
    }
  }

  // Log the sync run
  await db.syncRun.create({
    data: {
      totalProducts: liveProducts.length,
      added: added.length,
      removed: removed.length,
      wentInStock: wentInStock.length,
      wentOutOfStock: wentOutOfStock.length,
    },
  });

  return {
    totalProducts: liveProducts.length,
    added,
    removed,
    wentInStock,
    wentOutOfStock,
  };
}
