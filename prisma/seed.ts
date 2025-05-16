// prisma/seed.ts
import { PrismaClient, MediaType } from "@prisma/client";
import fs from "fs";
import path from "path";
import util from "util";

// Create a custom logger for the seed file (since we can't import from src)
const logger = {
  info: (message: string) => console.log(`[INFO] ${message}`),
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`);
    if (error) {
      if (error instanceof Error) {
        console.error(`[ERROR] ${error.message}`);
        console.error(`[ERROR] ${error.stack}`);
      } else {
        console.error(`[ERROR] ${util.inspect(error)}`);
      }
    }
  },
  warn: (message: string) => console.warn(`[WARN] ${message}`),
  debug: (message: string) => console.log(`[DEBUG] ${message}`),
};

const prisma = new PrismaClient();

async function main() {
  try {
    // Read sample data from the JSON file
    logger.info("Reading sample data file...");
    const dataPath = path.join(
      __dirname,
      "../src/seed/mock-data/sample-data.json"
    );

    if (!fs.existsSync(dataPath)) {
      throw new Error(`Sample data file not found at: ${dataPath}`);
    }

    const rawData = fs.readFileSync(dataPath, "utf8");
    let sampleData;

    try {
      sampleData = JSON.parse(rawData);
    } catch (error) {
      logger.error("Failed to parse sample data JSON:", error);
      throw new Error("Invalid JSON format in sample-data.json");
    }

    logger.info("Seeding database with advertising locations...");
    logger.info(
      `Found ${sampleData.workspaces.length} workspaces and ${sampleData.mediaItems.length} media items to seed`
    );

    // Clear existing data to avoid conflicts
    logger.info("Clearing existing data...");
    try {
      await prisma.route.deleteMany({});
      await prisma.staticMediaFace.deleteMany({});
      await prisma.mediaItem.deleteMany({});
      await prisma.workspace.deleteMany({});
      logger.info("Existing data cleared");
    } catch (error) {
      logger.error("Error clearing existing data:", error);
      throw new Error(
        "Failed to clear existing data. Make sure the database is accessible."
      );
    }

    // Seed workspaces
    logger.info("Seeding campaign workspaces...");
    for (const workspace of sampleData.workspaces) {
      try {
        await prisma.workspace.create({
          data: {
            id: workspace.id,
            name: workspace.name,
            email: workspace.email,
            address: workspace.address,
            location: workspace.location,
          },
        });
      } catch (error) {
        logger.error(
          `Error creating workspace ${workspace.name} (ID: ${workspace.id}):`,
          error
        );
        throw new Error(`Failed to create workspace ${workspace.name}`);
      }
    }
    logger.info(`${sampleData.workspaces.length} workspaces created`);

    // Seed media items
    logger.info("Seeding media locations...");
    for (const mediaItem of sampleData.mediaItems) {
      try {
        // Create the base media item first
        logger.info(
          `Creating media item "${mediaItem.name}" (${mediaItem.displayId})`
        );
        const createdMediaItem = await prisma.mediaItem.create({
          data: {
            id: mediaItem.id,
            workspaceId: mediaItem.workspaceId,
            type: mediaItem.type as MediaType,
            displayId: mediaItem.displayId,
            name: mediaItem.name,
            format: mediaItem.format,
            location: mediaItem.location,
            latitude: mediaItem.latitude,
            longitude: mediaItem.longitude,
            closestLandmark: mediaItem.closestLandmark,
            availability: mediaItem.availability,
          },
        });

        // Handle static media faces for billboards
        if (
          mediaItem.type === "BILLBOARD" &&
          mediaItem.staticMediaFaces &&
          mediaItem.staticMediaFaces.length > 0
        ) {
          logger.info(
            `Creating ${mediaItem.staticMediaFaces.length} static media faces for Billboard "${mediaItem.name}"`
          );

          for (const face of mediaItem.staticMediaFaces) {
            try {
              await prisma.staticMediaFace.create({
                data: {
                  id: face.id,
                  mediaItemId: createdMediaItem.id,
                  faceNumber: face.faceNumber,
                  description: face.description,
                  availability: face.availability,
                  imagesJson: face.imagesJson,
                  rent: face.rent,
                },
              });
            } catch (error) {
              logger.error(
                `Error creating static media face ${face.id} for media item "${mediaItem.name}":`,
                error
              );
              // Continue with next face rather than failing completely
              logger.warn(`Skipping face ${face.id} due to error`);
            }
          }
        }

        // Handle routes for street poles
        if (
          mediaItem.type === "STREET_POLE" &&
          mediaItem.routes &&
          mediaItem.routes.length > 0
        ) {
          logger.info(
            `Creating ${mediaItem.routes.length} routes for Street Pole "${mediaItem.name}"`
          );

          for (const route of mediaItem.routes) {
            try {
              await prisma.route.create({
                data: {
                  id: route.id,
                  mediaItemId: createdMediaItem.id,
                  routeName: route.routeName,
                  sideRoute: route.sideRoute,
                  description: route.description,
                  numberOfStreetPoles: route.numberOfStreetPoles,
                  pricePerStreetPole: route.pricePerStreetPole,
                  imagesJson: route.imagesJson,
                },
              });
            } catch (error) {
              logger.error(
                `Error creating route ${route.id} for media item "${mediaItem.name}":`,
                error
              );
              // Continue with next route rather than failing completely
              logger.warn(`Skipping route ${route.id} due to error`);
            }
          }
        }
      } catch (error) {
        logger.error(
          `Error creating media item "${mediaItem.name}" (ID: ${mediaItem.id}):`,
          error
        );
        // Continue with next media item rather than failing the entire seeding process
        logger.warn(`Skipping media item "${mediaItem.name}" due to error`);
      }
    }
    logger.info(`${sampleData.mediaItems.length} media locations created`);

    // Verify data was created
    try {
      const workspaceCount = await prisma.workspace.count();
      const mediaItemCount = await prisma.mediaItem.count();
      const billboardCount = await prisma.mediaItem.count({
        where: { type: "BILLBOARD" },
      });
      const streetPoleCount = await prisma.mediaItem.count({
        where: { type: "STREET_POLE" },
      });
      const staticMediaFaceCount = await prisma.staticMediaFace.count();
      const routeCount = await prisma.route.count();

      logger.info(`Database seeding completed successfully.`);
      logger.info(
        `Created: ${workspaceCount} workspaces, ${mediaItemCount} media items (${billboardCount} billboards, ${streetPoleCount} street poles)`
      );
      logger.info(
        `Created: ${staticMediaFaceCount} static media faces, ${routeCount} routes`
      );
    } catch (error) {
      logger.error("Error verifying seeded data:", error);
      // Don't throw here, as the seeding might have been partially successful
    }
  } catch (error) {
    logger.error("Error seeding database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    logger.error("Unhandled exception during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } catch (err) {
      logger.error("Error disconnecting from Prisma:", err);
    }
  });