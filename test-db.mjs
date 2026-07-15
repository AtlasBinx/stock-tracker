import { PrismaClient } from "@prisma/client";

// Absolute path removes all ambiguity about cwd
const db = new PrismaClient({
  datasources: { db: { url: "file:C:/Users/Blake/OneDrive/Desktop/stock-tracker/prisma/dev.db" } }
});

try {
  const rows = await db.guitarProduct.findMany();
  console.log("OK:", rows.length, "rows");
} catch (e) {
  console.error("ERROR:", e.message);
} finally {
  await db.$disconnect();
}
