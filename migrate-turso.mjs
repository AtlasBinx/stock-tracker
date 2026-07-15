import { createClient } from "@libsql/client";

const client = createClient({
  url: "libsql://stock-tracker-atlasbinx.aws-us-west-2.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQwNzU5MjQsImlkIjoiMDE5ZjYzMzUtOTEwMS03Yzc0LWFkZTgtNjI1MGFhNTBjNWNmIiwia2lkIjoiVGlqei0zME1UUEF1ZktZYmFyNk9RVU16c0hKSmxZZGhrSnRSSUYtUGlGbyIsInJpZCI6IjAxMTVjYjg0LTc1YzEtNDE2Zi1iNjUzLWVmNDc1ZDY1NDllNyJ9.Kx3BfIBp888kzgS0Sexbk0x6csZjwK5d8UYCf5WJYF10-Ozm6aeUh9GJm5cmoTIJRwWwei8vn1WHyX44r_FxBQ",
});

const statements = [
  `CREATE TABLE IF NOT EXISTS "GuitarProduct" (
    "id"        INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shopifyId" TEXT NOT NULL UNIQUE,
    "title"     TEXT NOT NULL,
    "handle"    TEXT NOT NULL,
    "sku"       TEXT,
    "price"     TEXT,
    "available" INTEGER NOT NULL DEFAULT 0,
    "active"    INTEGER NOT NULL DEFAULT 1,
    "firstSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "GuitarEvent" (
    "id"        INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "type"      TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("productId") REFERENCES "GuitarProduct"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "GuitarEvent_productId_createdAt_idx" ON "GuitarEvent"("productId", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "GuitarEvent_createdAt_idx" ON "GuitarEvent"("createdAt")`,
  `CREATE TABLE IF NOT EXISTS "SyncRun" (
    "id"             INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "checkedAt"      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalProducts"  INTEGER NOT NULL,
    "added"          INTEGER NOT NULL DEFAULT 0,
    "removed"        INTEGER NOT NULL DEFAULT 0,
    "wentInStock"    INTEGER NOT NULL DEFAULT 0,
    "wentOutOfStock" INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS "Subscriber" (
    "id"        INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name"      TEXT NOT NULL,
    "email"     TEXT NOT NULL UNIQUE,
    "phone"     TEXT,
    "active"    INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
];

for (const sql of statements) {
  await client.execute(sql);
  console.log("OK:", sql.slice(0, 60).replace(/\n/g, " ").trim() + "...");
}

console.log("\nAll tables created in Turso.");
await client.close();
