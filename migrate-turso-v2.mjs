/**
 * Adds payment/subscription columns to Subscriber table
 * and creates AffiliateCode + AffiliateUse tables in Turso.
 */
import { createClient } from "@libsql/client";

const client = createClient({
  url: "libsql://stock-tracker-atlasbinx.aws-us-west-2.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQwNzU5MjQsImlkIjoiMDE5ZjYzMzUtOTEwMS03Yzc0LWFkZTgtNjI1MGFhNTBjNWNmIiwia2lkIjoiVGlqei0zME1UUEF1ZktZYmFyNk9RVU16c0hKSmxZZGhrSnRSSUYtUGlGbyIsInJpZCI6IjAxMTVjYjg0LTc1YzEtNDE2Zi1iNjUzLWVmNDc1ZDY1NDllNyJ9.Kx3BfIBp888kzgS0Sexbk0x6csZjwK5d8UYCf5WJYF10-Ozm6aeUh9GJm5cmoTIJRwWwei8vn1WHyX44r_FxBQ",
});

const statements = [
  // Add new columns to Subscriber (SQLite ignores ADD COLUMN if column exists via IF NOT EXISTS workaround)
  `ALTER TABLE "Subscriber" ADD COLUMN "stripeCustomerId" TEXT`,
  `ALTER TABLE "Subscriber" ADD COLUMN "stripeSubscriptionId" TEXT`,
  `ALTER TABLE "Subscriber" ADD COLUMN "plan" TEXT`,
  `ALTER TABLE "Subscriber" ADD COLUMN "planStatus" TEXT`,
  `ALTER TABLE "Subscriber" ADD COLUMN "accessExpiresAt" DATETIME`,
  `ALTER TABLE "Subscriber" ADD COLUMN "promoCode" TEXT`,

  // Unique indexes for Stripe IDs
  `CREATE UNIQUE INDEX IF NOT EXISTS "Subscriber_stripeCustomerId_key" ON "Subscriber"("stripeCustomerId") WHERE "stripeCustomerId" IS NOT NULL`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Subscriber_stripeSubscriptionId_key" ON "Subscriber"("stripeSubscriptionId") WHERE "stripeSubscriptionId" IS NOT NULL`,

  // AffiliateCode table
  `CREATE TABLE IF NOT EXISTS "AffiliateCode" (
    "id"                INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code"              TEXT NOT NULL UNIQUE,
    "creatorName"       TEXT NOT NULL,
    "stripeCouponId"    TEXT,
    "stripePromoCodeId" TEXT,
    "active"            INTEGER NOT NULL DEFAULT 1,
    "createdAt"         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  // AffiliateUse table
  `CREATE TABLE IF NOT EXISTS "AffiliateUse" (
    "id"           INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codeId"       INTEGER NOT NULL,
    "subscriberId" INTEGER NOT NULL,
    "plan"         TEXT NOT NULL,
    "amount"       REAL NOT NULL,
    "bounty"       REAL NOT NULL,
    "createdAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("codeId") REFERENCES "AffiliateCode"("id"),
    FOREIGN KEY ("subscriberId") REFERENCES "Subscriber"("id")
  )`,
];

for (const sql of statements) {
  try {
    await client.execute(sql);
    console.log("OK:", sql.slice(0, 70).replace(/\n/g, " ").trim());
  } catch (err) {
    // Column already exists errors are OK to skip
    if (err.message?.includes("duplicate column")) {
      console.log("SKIP (already exists):", sql.slice(0, 50).trim());
    } else {
      throw err;
    }
  }
}

console.log("\nMigration complete.");
await client.close();
