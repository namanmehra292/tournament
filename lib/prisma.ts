import { PrismaClient } from "@prisma/client";

// Prevents exhausting DB connections from hot-reload in dev.
// Prisma's parameterized queries are what actually prevent SQL
// injection here — every call below uses the query builder, never
// raw string concatenation. If raw SQL is ever unavoidable, use
// prisma.$queryRaw with tagged templates (never $queryRawUnsafe
// with interpolated user input).

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
