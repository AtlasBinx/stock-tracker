import { PrismaClient } from "@prisma/client";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = path.resolve(__dirname, "prisma", "dev.db").replace(/\\/g, "/");
console.log("dbPath:", dbPath);

const db = new PrismaClient({
  datasources: { db: { url: `file:${dbPath}` } },
});

try {
  console.log("Testing guitarProduct.findMany...");
  const products = await db.guitarProduct.findMany();
  console.log("OK:", products.length, "products");

  console.log("Testing syncRun.findMany...");
  const syncs = await db.syncRun.findMany();
  console.log("OK:", syncs.length, "syncs");

  console.log("Testing guitarEvent.findMany...");
  const events = await db.guitarEvent.findMany();
  console.log("OK:", events.length, "events");
} catch (e) {
  console.error("FAILED:", e.message);
  console.error(e.stack);
} finally {
  await db.$disconnect();
}
