/**
 * migrate-turso-v3.mjs
 * Adds smsConsent column to the Subscriber table in Turso.
 * Run once: node migrate-turso-v3.mjs
 */
import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const migrations = [
  `ALTER TABLE Subscriber ADD COLUMN smsConsent INTEGER NOT NULL DEFAULT 0`,
];

for (const sql of migrations) {
  try {
    await client.execute(sql);
    console.log("✓", sql);
  } catch (err) {
    if (err.message?.includes("duplicate column")) {
      console.log("⚠ already exists, skipping:", sql);
    } else {
      throw err;
    }
  }
}

console.log("\nMigration complete.");
