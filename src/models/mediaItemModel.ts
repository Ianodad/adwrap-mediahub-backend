// src/models/mediaItemModel.ts
import {
  PrismaClient,
  MediaItem as PrismaMediaItem,
  MediaType,
} from "@prisma/client";
import { generateWorkspaceScopedId } from "../utils/idGenerator";
import logger from "../utils/logger";
import { ApiError } from "../middleware/errorHandler";
import { handlePrismaError } from "../utils/prismaErrorHandler";

export async function createMediaItem(
  prisma: PrismaClient,
  input: {
    workspaceId: number;
    type: MediaType;
    name: string;
    displayId?: string;
    format?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    closestLandmark?: string;
    availability?: string;
    staticMediaFaces?: any[];
    routes?: any[];
  }
): Promise<PrismaMediaItem> {
  let retryCount = 0;
  const MAX_RETRIES = 3;

  async function attemptCreate() {
    try {
      logger.info(
        `Creating new ${input.type} media item: ${input.name} (attempt ${
          retryCount + 1
        })`
      );

      // Extract fields from input
      const {
        workspaceId,
        type,
        name,
        staticMediaFaces: rawStaticMediaFaces,
        routes: rawRoutes,
        displayId: providedDisplayId,
        ...restOfInput
      } = input;

      // Important: Remove any potential 'id' field from restOfInput
      const { id, ...dataWithoutId } = restOfInput as any;

      if (id) {
        logger.warn(
          `ID field detected in input and removed to avoid conflicts`
        );
      }

      // Check if workspace exists
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      });

      if (!workspace) {
        logger.error(
          `Cannot create media item: Workspace with ID ${workspaceId} not found`
        );
        throw ApiError.badRequest(`Workspace with ID ${workspaceId} not found`);
      }

      // Generate workspace-scoped ID (e.g., BB-1, SP-1) if not provided
      let displayId = providedDisplayId;
      if (!displayId) {
        try {
          displayId = await generateWorkspaceScopedId(
            prisma,
            workspaceId,
            type
          );
          logger.debug(`Generated displayId: ${displayId} for new media item`);
        } catch (error) {
          logger.error(
            `Error generating displayId: ${
              error instanceof Error ? error.message : error
            }`
          );
          throw error;
        }
      }

      // Process static media faces and routes as before...
      let processedStaticMediaFaces;
      if (
        type === "BILLBOARD" &&
        rawStaticMediaFaces &&
        rawStaticMediaFaces.length > 0
      ) {
        processedStaticMediaFaces = rawStaticMediaFaces.map((face) => {
          const { id: faceId, ...faceWithoutId } = face;
          if (faceId) {
            logger.warn(
              `ID field detected in static media face and removed to avoid conflicts`
            );
          }
          return {
            faceNumber: faceWithoutId.faceNumber,
            description: faceWithoutId.description,
            availability: faceWithoutId.availability,
            imagesJson: faceWithoutId.images
              ? JSON.stringify(faceWithoutId.images)
              : null,
            rent: faceWithoutId.rent,
          };
        });
      }

      let processedRoutes;
      if (type === "STREET_POLE" && rawRoutes && rawRoutes.length > 0) {
        processedRoutes = rawRoutes.map((route) => {
          const { id: routeId, ...routeWithoutId } = route;
          if (routeId) {
            logger.warn(
              `ID field detected in route and removed to avoid conflicts`
            );
          }
          return {
            routeName: routeWithoutId.routeName,
            sideRoute: routeWithoutId.sideRoute,
            description: routeWithoutId.description,
            numberOfStreetPoles: routeWithoutId.numberOfStreetPoles,
            pricePerStreetPole: routeWithoutId.pricePerStreetPole,
            imagesJson: routeWithoutId.images
              ? JSON.stringify(routeWithoutId.images)
              : null,
          };
        });
      }

      // Create the media item
      const mediaItem = await prisma.mediaItem.create({
        data: {
          workspaceId,
          type,
          displayId,
          name,
          ...dataWithoutId,

          staticMediaFaces:
            type === "BILLBOARD" &&
            processedStaticMediaFaces &&
            processedStaticMediaFaces.length > 0
              ? { create: processedStaticMediaFaces }
              : undefined,

          routes:
            type === "STREET_POLE" &&
            processedRoutes &&
            processedRoutes.length > 0
              ? { create: processedRoutes }
              : undefined,
        },
        include: {
          staticMediaFaces: true,
          routes: true,
        },
      });

      logger.info(
        `Created new media item with ID ${mediaItem.id} and displayId ${mediaItem.displayId}`
      );
      return mediaItem;
    } catch (error) {
      logger.error(
        `Error creating media item "${input.name}" (attempt ${
          retryCount + 1
        }): ${error instanceof Error ? error.message : error}`
      );

      // Handle specific errors
      if (error instanceof Error) {
        // Handle ID conflict errors specifically
        if (
          error.message.includes(
            "Unique constraint failed on the fields: (`id`)"
          )
        ) {
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            logger.warn(
              `ID conflict detected. Resetting sequence and retrying (attempt ${retryCount})`
            );

            // Fix the sequence by finding the max ID and resetting the sequence
            try {
              // First get the maximum ID in the table
              const maxIdResult = await prisma.$queryRaw`
                SELECT MAX(id) as max_id FROM "MediaItem"
              `;

              const maxId = (maxIdResult as any)[0]?.max_id || 0;

              // Reset the sequence to be max_id + 1
              await prisma.$executeRaw`
                SELECT setval('"MediaItem_id_seq"', ${maxId}, true)
              `;

              logger.info(`Reset MediaItem_id_seq to ${maxId + 1}`);

              // Retry the creation with the updated sequence
              return await attemptCreate();
            } catch (seqError) {
              logger.error(
                `Failed to reset sequence: ${
                  seqError instanceof Error ? seqError.message : seqError
                }`
              );
              throw ApiError.internal(
                "Database ID sequence reset failed. Please contact support."
              );
            }
          } else {
            logger.error(
              `Maximum retry attempts (${MAX_RETRIES}) exceeded for ID conflict resolution`
            );
            throw ApiError.internal(
              `Database ID conflict could not be resolved after ${MAX_RETRIES} attempts. Please contact support.`
            );
          }
        }

        if (error.message.includes("Unique constraint failed")) {
          throw ApiError.badRequest(
            `Media item with this display ID (${input.displayId}) already exists for this workspace`
          );
        }

        // If it's already an ApiError, just rethrow it
        if (error instanceof ApiError) {
          throw error;
        }
      }

      // Use the general Prisma error handler
      return handlePrismaError(error, `creating media item "${input.name}"`);
    }
  }

  // Start the first attempt
  return attemptCreate();
}


export async function updateMediaItem(
  prisma: PrismaClient,
  id: number,
  input: {
    name?: string;
    format?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    closestLandmark?: string;
    availability?: string;
    staticMediaFaces?: any[];
    routes?: any[];
  }
): Promise<PrismaMediaItem> {
  try {
    logger.info(`Updating media item with ID ${id}`);

    // Check if the media item exists
    const existingItem = await prisma.mediaItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      logger.error(`Media item with ID ${id} not found`);
      throw ApiError.notFound(`Media item with ID ${id} not found`);
    }

    const { name, staticMediaFaces, routes, ...restOfInput } = input;

    const mediaItem = await prisma.mediaItem.update({
      where: { id },
      data: {
        name,
        ...restOfInput,
        staticMediaFaces: staticMediaFaces
          ? {
              upsert: staticMediaFaces.map((face) => ({
                where: { id: face.id || 0 },
                update: face,
                create: face,
              })),
            }
          : undefined,
        routes: routes
          ? {
              upsert: routes.map((route) => ({
                where: { id: route.id || 0 },
                update: route,
                create: route,
              })),
            }
          : undefined,
      },
      include: {
        staticMediaFaces: true,
        routes: true,
      },
    });

    logger.info(`Updated media item with ID ${mediaItem.id}`);
    return mediaItem;
  } catch (error) {
    logger.error(
      `Error updating media item with ID ${id}: ${
        error instanceof Error ? error.message : error
      }`
    );
    throw error;
  }
}

export async function deleteMediaItem(
  prisma: PrismaClient,
  id: number
): Promise<boolean> {
  try {
    logger.info(`Deleting media item with ID ${id}`);

    // Check if media item exists
    const existingItem = await prisma.mediaItem.findUnique({
      where: { id },
      include: {
        staticMediaFaces: true,
        routes: true,
      },
    });

    if (!existingItem) {
      logger.warn(`Attempted to delete non-existent media item with ID ${id}`);
      throw ApiError.notFound(`Media item with ID ${id} not found`);
    }

    // Use a transaction to ensure all related records are deleted
    return await prisma.$transaction(async (tx) => {
      try {
        // For BILLBOARD type, delete all static media faces first
        if (
          existingItem.type === "BILLBOARD" &&
          existingItem.staticMediaFaces.length > 0
        ) {
          logger.info(
            `Deleting ${existingItem.staticMediaFaces.length} static media faces for media item ${id}`
          );

          await tx.staticMediaFace.deleteMany({
            where: { mediaItemId: id },
          });
        }

        // For STREET_POLE type, delete all routes first
        if (
          existingItem.type === "STREET_POLE" &&
          existingItem.routes.length > 0
        ) {
          logger.info(
            `Deleting ${existingItem.routes.length} routes for media item ${id}`
          );

          await tx.route.deleteMany({
            where: { mediaItemId: id },
          });
        }

        // Now delete the media item itself
        await tx.mediaItem.delete({
          where: { id },
        });

        logger.info(
          `Successfully deleted media item with ID ${id} and all related entities`
        );
        return true;
      } catch (txError) {
        logger.error(
          `Transaction error deleting media item ${id}: ${
            txError instanceof Error ? txError.message : txError
          }`
        );
        throw txError;
      }
    });
  } catch (error) {
    logger.error(
      `Error deleting media item with ID ${id}: ${
        error instanceof Error ? error.message : error
      }`
    );

    // Specific error handling for foreign key constraint violations
    if (
      error instanceof Error &&
      error.message.includes("Foreign key constraint failed")
    ) {
      throw ApiError.badRequest(
        `Cannot delete media item as it has related records. Please delete related entities first.`
      );
    }

    throw error;
  }
}

export async function getMediaItems(
  prisma: PrismaClient,
  workspaceId: number
): Promise<PrismaMediaItem[]> {
  try {
    logger.info(`Fetching media items for workspace ID ${workspaceId}`);

    // Verify workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      logger.error(`Workspace with ID ${workspaceId} not found`);
      throw ApiError.notFound(`Workspace with ID ${workspaceId} not found`);
    }

    const items = await prisma.mediaItem.findMany({
      where: { workspaceId },
      include: {
        staticMediaFaces: true,
        routes: true,
      },
    });

    logger.info(
      `Found ${items.length} media items for workspace ID ${workspaceId}`
    );
    return items;
  } catch (error) {
    logger.error(
      `Error fetching media items for workspace ${workspaceId}: ${
        error instanceof Error ? error.message : error
      }`
    );
    throw error;
  }
}

export async function getMediaItemById(
  prisma: PrismaClient,
  id: number
): Promise<PrismaMediaItem | null> {
  try {
    logger.info(`Fetching media item with ID ${id}`);
    const item = await prisma.mediaItem.findUnique({
      where: { id },
      include: {
        staticMediaFaces: true,
        routes: true,
      },
    });

    if (!item) {
      logger.warn(`Media item with ID ${id} not found`);
      return null;
    }

    logger.info(`Found media item with ID ${id}`);
    return item;
  } catch (error) {
    logger.error(
      `Error fetching media item with ID ${id}: ${
        error instanceof Error ? error.message : error
      }`
    );
    throw error;
  }
}
