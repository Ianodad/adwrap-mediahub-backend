// src/graphql/context.ts
import { PrismaClient } from "@prisma/client";
import { GraphQLContext } from "../types/shared";

// Create a single instance of Prisma Client with appropriate logging
const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "info", "warn", "error"]
      : ["error"],

  // Add error formatting for better debugging
  errorFormat: "pretty",
});

// Handle Prisma connection lifecycle
prisma
  .$connect()
  .then(() => {
    console.log("✅ Prisma connected successfully");
  })
  .catch((error) => {
    console.error("❌ Prisma connection failed:", error);
    process.exit(1);
  });

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
  console.log("🔌 Prisma disconnected");
});

export function createContext(): GraphQLContext {
  return { prisma };
}

// Export the context type and prisma instance for use in other files
export type { GraphQLContext };
export { prisma };
