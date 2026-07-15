import { PrismaClient } from "@prisma/client";
import path from "path";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  // Build absolute path so OneDrive/Windows relative paths don't cause issues
  const dbPath = path
    .resolve(process.cwd(), "prisma", "dev.db")
    .replace(/\\/g, "/");

  return new PrismaClient({
    datasources: { db: { url: `file:${dbPath}` } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
