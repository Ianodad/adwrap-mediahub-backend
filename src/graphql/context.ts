// src/graphql/context.ts
import { PrismaClient } from '@prisma/client';

export interface Context {
  prisma: PrismaClient;
}

// Create a single instance of Prisma Client
const prisma = new PrismaClient();

export function createContext(): Context {
  return { prisma };
}