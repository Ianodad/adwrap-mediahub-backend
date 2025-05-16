// src/graphql/resolvers/mediaItemResolver.ts
import { PrismaClient } from "@prisma/client";
import { MediaItem, MediaType } from "../schemas/generated-types";
import {
  createMediaItem,
  updateMediaItem,
  deleteMediaItem,
  getMediaItems,
  getMediaItemById,
} from "../../models/mediaItemModel";
import logger from "../../utils/logger";
import { ApiError } from "../../middleware/errorHandler";
import { generateWorkspaceScopedId } from "../../utils/idGenerator";

interface Context {
  prisma: PrismaClient;
}

export const mediaItemResolvers = {
  Query: {
    mediaItems: async (
      _: any,
      { workspaceId }: { workspaceId: number },
      context: Context
    ) => {
      try {
        logger.debug(`GraphQL Query: mediaItems for workspace ${workspaceId}`);
        return await getMediaItems(context.prisma, workspaceId);
      } catch (error) {
        logger.error(
          `GraphQL Query Error - mediaItems: ${
            error instanceof Error ? error.message : error
          }`
        );
        throw error;
      }
    },

    mediaItem: async (_: any, { id }: { id: string }, context: Context) => {
      try {
        const numericId = parseInt(id);
        logger.debug(`GraphQL Query: mediaItem with ID ${numericId}`);

        if (isNaN(numericId)) {
          logger.error(`Invalid ID format: ${id}`);
          throw ApiError.badRequest(`Invalid ID format: ${id}`);
        }

        const item = await getMediaItemById(context.prisma, numericId);

        if (!item) {
          logger.debug(
            `GraphQL Query: mediaItem with ID ${numericId} not found`
          );
        }

        return item;
      } catch (error) {
        logger.error(
          `GraphQL Query Error - mediaItem: ${
            error instanceof Error ? error.message : error
          }`
        );
        throw error;
      }
    },
  },

  Mutation: {
    createMediaItem: async (
      _: any,
      {
        input,
      }: {
        input: {
          workspaceId: number;
          type: MediaType;
          name: string;
          format?: string;
          location?: string;
          latitude?: number;
          longitude?: number;
          closestLandmark?: string;
          availability?: string;
          staticMediaFaces?: any[];
          routes?: any[];
        };
      },
      context: Context
    ) => {
      try {
        logger.debug(
          `GraphQL Mutation: createMediaItem for workspace ${input.workspaceId}`
        );

        // Validate input
        if (!input.name || input.name.trim() === "") {
          logger.error("Invalid media item name: Name cannot be empty");
          throw ApiError.badRequest("Name cannot be empty");
        }

        // Validate that the workspace exists
        const workspace = await context.prisma.workspace.findUnique({
          where: { id: input.workspaceId },
        });

        if (!workspace) {
          logger.error(`Workspace with ID ${input.workspaceId} not found`);
          throw ApiError.notFound(
            `Workspace with ID ${input.workspaceId} not found`
          );
        }

        // Validate each staticMediaFace
        if (
          input.type === "BILLBOARD" &&
          input.staticMediaFaces &&
          input.staticMediaFaces.length > 0
        ) {
          // Validate face numbers
          const faceNumbers = new Set();
          for (const face of input.staticMediaFaces) {
            if (!face.faceNumber || face.faceNumber <= 0) {
              throw ApiError.badRequest("Face number must be positive");
            }

            if (faceNumbers.has(face.faceNumber)) {
              throw ApiError.badRequest(
                `Duplicate face number: ${face.faceNumber}`
              );
            }

            faceNumbers.add(face.faceNumber);

            if (face.rent !== undefined && face.rent < 0) {
              throw ApiError.badRequest("Rent cannot be negative");
            }
          }
        }

        // Validate each route
        if (
          input.type === "STREET_POLE" &&
          input.routes &&
          input.routes.length > 0
        ) {
          for (const route of input.routes) {
            if (!route.routeName || route.routeName.trim() === "") {
              throw ApiError.badRequest("Route name cannot be empty");
            }

            if (
              route.numberOfStreetPoles !== undefined &&
              route.numberOfStreetPoles <= 0
            ) {
              throw ApiError.badRequest(
                "Number of street poles must be positive"
              );
            }

            if (
              route.pricePerStreetPole !== undefined &&
              route.pricePerStreetPole < 0
            ) {
              throw ApiError.badRequest(
                "Price per street pole cannot be negative"
              );
            }
          }
        }

        // Type validation
        if (
          input.type === "BILLBOARD" &&
          input.routes &&
          input.routes.length > 0
        ) {
          logger.warn(
            "Routes provided for BILLBOARD type - these will be ignored"
          );
        }

        if (
          input.type === "STREET_POLE" &&
          input.staticMediaFaces &&
          input.staticMediaFaces.length > 0
        ) {
          logger.warn(
            "Static media faces provided for STREET_POLE type - these will be ignored"
          );
        }

        // Generate display ID before creating media item - with retry logic
        let displayId;
        let retryCount = 0;
        const MAX_RETRIES = 3;

        while (retryCount < MAX_RETRIES) {
          try {
            // Pre-generate the display ID
            displayId = await generateWorkspaceScopedId(
              context.prisma,
              input.workspaceId,
              input.type
            );
            logger.debug(
              `Pre-generated displayId: ${displayId} for new media item (attempt ${
                retryCount + 1
              })`
            );

            // Check if this ID already exists
            const existingWithId = await context.prisma.mediaItem.findFirst({
              where: {
                workspaceId: input.workspaceId,
                displayId,
              },
            });

            if (!existingWithId) {
              // If no conflict, break the loop and proceed
              break;
            }

            logger.warn(
              `DisplayId ${displayId} already exists for workspace ${input.workspaceId}, retrying...`
            );
            retryCount++;
          } catch (idError) {
            logger.error(
              `Error generating displayId (attempt ${retryCount + 1}): ${
                idError instanceof Error ? idError.message : idError
              }`
            );
            retryCount++;

            if (retryCount >= MAX_RETRIES) {
              throw idError;
            }
          }
        }

        if (retryCount >= MAX_RETRIES) {
          throw ApiError.internal(
            `Failed to generate a unique display ID after ${MAX_RETRIES} attempts`
          );
        }

        // Add the displayId to the input
        const mediaItemData = {
          ...input,
          displayId,
        };

        // Call the model function
        return await createMediaItem(context.prisma, mediaItemData);
      } catch (error) {
        logger.error(
          `GraphQL Mutation Error - createMediaItem: ${
            error instanceof Error ? error.message : error
          }`
        );
        throw error;
      }
    },

    updateMediaItem: async (
      _: any,
      {
        id,
        input,
      }: {
        id: string;
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
        };
      },
      context: Context
    ) => {
      try {
        const numericId = parseInt(id);
        logger.debug(`GraphQL Mutation: updateMediaItem with ID ${numericId}`);

        if (isNaN(numericId)) {
          logger.error(`Invalid ID format: ${id}`);
          throw ApiError.badRequest(`Invalid ID format: ${id}`);
        }

        // Validate input - check that at least one field is being updated
        if (Object.keys(input).length === 0) {
          logger.error("Empty update payload for updateMediaItem");
          throw ApiError.badRequest(
            "Update must include at least one field to modify"
          );
        }

        return await updateMediaItem(context.prisma, numericId, input);
      } catch (error) {
        logger.error(
          `GraphQL Mutation Error - updateMediaItem: ${
            error instanceof Error ? error.message : error
          }`
        );
        throw error;
      }
    },

    deleteMediaItem: async (
      _: any,
      { id }: { id: string },
      context: Context
    ) => {
      try {
        const numericId = parseInt(id);
        logger.debug(`GraphQL Mutation: deleteMediaItem with ID ${numericId}`);

        if (isNaN(numericId)) {
          logger.error(`Invalid ID format: ${id}`);
          throw ApiError.badRequest(`Invalid ID format: ${id}`);
        }

        return await deleteMediaItem(context.prisma, numericId);
      } catch (error) {
        logger.error(
          `GraphQL Mutation Error - deleteMediaItem: ${
            error instanceof Error ? error.message : error
          }`
        );
        throw error;
      }
    },
  },

  MediaItem: {
    workspace: async (parent: MediaItem, _: any, context: Context) => {
      try {
        const workspaceId =
          typeof parent.workspaceId === "string"
            ? parseInt(parent.workspaceId)
            : parent.workspaceId;

        const workspace = await context.prisma.workspace.findUnique({
          where: { id: workspaceId },
        });

        if (!workspace) {
          logger.error(
            `Workspace with ID ${workspaceId} not found for MediaItem ${parent.id}`
          );
          throw ApiError.notFound(`Workspace with ID ${workspaceId} not found`);
        }

        return workspace;
      } catch (error) {
        logger.error(
          `Error resolving workspace for MediaItem ${parent.id}: ${
            error instanceof Error ? error.message : error
          }`
        );
        throw error;
      }
    },

    staticMediaFaces: async (parent: MediaItem, _: any, context: Context) => {
      try {
        if (parent.type !== "BILLBOARD") {
          logger.debug(
            `No staticMediaFaces for non-BILLBOARD media item ${parent.id}`
          );
          return null;
        }

        // Convert string ID to number
        const mediaItemId =
          typeof parent.id === "string" ? parseInt(parent.id) : parent.id;

        const faces = await context.prisma.staticMediaFace.findMany({
          where: { mediaItemId },
        });

        logger.debug(
          `Found ${faces.length} staticMediaFaces for MediaItem ${parent.id}`
        );
        return faces;
      } catch (error) {
        logger.error(
          `Error resolving staticMediaFaces for MediaItem ${parent.id}: ${
            error instanceof Error ? error.message : error
          }`
        );
        throw error;
      }
    },

    routes: async (parent: MediaItem, _: any, context: Context) => {
      try {
        if (parent.type !== "STREET_POLE") {
          logger.debug(`No routes for non-STREET_POLE media item ${parent.id}`);
          return null;
        }

        // Convert string ID to number
        const mediaItemId =
          typeof parent.id === "string" ? parseInt(parent.id) : parent.id;

        const routes = await context.prisma.route.findMany({
          where: { mediaItemId },
        });

        logger.debug(
          `Found ${routes.length} routes for MediaItem ${parent.id}`
        );
        return routes;
      } catch (error) {
        logger.error(
          `Error resolving routes for MediaItem ${parent.id}: ${
            error instanceof Error ? error.message : error
          }`
        );
        throw error;
      }
    },
  },
};
