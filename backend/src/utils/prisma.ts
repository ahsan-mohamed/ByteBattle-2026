import { PrismaClient } from "@prisma/client";

// Reuse a single PrismaClient instance (with connection pooling) across the app.
// This matters at 100+ concurrent participants: avoid spinning up new pools per request.
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

export async function disconnectPrisma() {
  await prisma.$disconnect();
}
