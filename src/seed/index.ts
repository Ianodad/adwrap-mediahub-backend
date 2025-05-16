// src/seed/index.ts
import { PrismaClient } from "@prisma/client";
import mockData from "./mock-data/sample-data.json"; // Assuming mock data is in JSON format
import logger from "@/utils/logger";

const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    console.log("Seeding database...");

    // Seed workspaces without specifying IDs
    for (const workspace of mockData.workspaces) {
      // Remove the ID to let database auto-generate it
      const { id, ...workspaceWithoutId } = workspace;

      await prisma.workspace.upsert({
        where: { id: workspace.id },
        update: workspaceWithoutId,
        create: workspaceWithoutId,
      });
    }

    // Seed media items without specifying IDs
    for (const mediaItem of mockData.mediaItems) {
      // Remove the IDs from media items and related entities
      const { id, staticMediaFaces, routes, ...mediaItemWithoutId } = mediaItem;

      let processedStaticMediaFaces;
      if (staticMediaFaces) {
        processedStaticMediaFaces = staticMediaFaces.map((face) => {
          const { id, ...faceWithoutId } = face;
          return faceWithoutId;
        });
      }

      let processedRoutes;
      if (routes) {
        processedRoutes = routes.map((route) => {
          const { id, ...routeWithoutId } = route;
          return routeWithoutId;
        });
      }

     try {
       await prisma.mediaItem.upsert({
         where: { id: mediaItem.id },
         update: mediaItemWithoutId,
         create: {
           ...mediaItemWithoutId,
           type: mediaItem.type, // Add this line
           staticMediaFaces: processedStaticMediaFaces
             ? { create: processedStaticMediaFaces }
             : undefined,
           routes: processedRoutes ? { create: processedRoutes } : undefined,
         },
       });
     } catch (error) {
       console.error(`Error seeding media item ${mediaItem.name}:`, error);
       // Continue with next item
     }
    }

    console.log("Database seeding completed.");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function resetSequences(prisma: PrismaClient) {
  try {
    logger.info("Resetting database sequences...");

    // Reset MediaItem sequence
    await prisma.$executeRaw`
      SELECT setval('"MediaItem_id_seq"', (SELECT MAX(id) FROM "MediaItem"), true);
    `;

    // Reset StaticMediaFace sequence
    await prisma.$executeRaw`
      SELECT setval('"StaticMediaFace_id_seq"', (SELECT MAX(id) FROM "StaticMediaFace"), true);
    `;

    // Reset Route sequence
    await prisma.$executeRaw`
      SELECT setval('"Route_id_seq"', (SELECT MAX(id) FROM "Route"), true);
    `;

    logger.info("Database sequences reset successfully");
  } catch (error) {
    logger.error(
      `Error resetting sequences: ${
        error instanceof Error ? error.message : error
      }`
    );
  }
}


seedDatabase();
await resetSequences(prisma);
