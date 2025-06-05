// src/graphql/resolvers/mediaItemResolver.ts
import { MediaItem } from "../schemas/generated-types";
import {
  createMediaItem,
  updateMediaItem,
  deleteMediaItem,
  getMediaItems,
  getMediaItemById,
} from "../../models/mediaItemModel";
import { GraphQLInputValidator } from "../../validators";
import logger from "../../utils/logger";
import { ApiError } from "../../middleware/errorHandler";
import { generateWorkspaceScopedId } from "../../utils/idGenerator";
import { GraphQLContext } from "../../types/shared";

export const mediaItemResolvers = {
  Query: {
    mediaItems: async (
      _: any,
      { workspaceId }: { workspaceId: number },
      context: GraphQLContext
    ) => {
      try {
        // Validate workspaceId
        if (!Number.isInteger(workspaceId) || workspaceId <= 0) {
          logger.error(
            `Invalid workspace ID for mediaItems query: ${workspaceId}`
          );
          throw ApiError.badRequest("Workspace ID must be a positive integer");
        }

        logger.debug(`GraphQL Query: mediaItems for workspace ${workspaceId}`);

        // Verify workspace exists
        const workspace = await context.prisma.workspace.findUnique({
          where: { id: workspaceId },
        });

        if (!workspace) {
          logger.error(`Workspace with ID ${workspaceId} not found`);
          throw ApiError.notFound(`Workspace with ID ${workspaceId} not found`);
        }

        const mediaItems = await getMediaItems(context.prisma, workspaceId);
        logger.info(
          `Found ${mediaItems.length} media items for workspace ${workspaceId}`
        );

        return mediaItems;
      } catch (error) {
        logger.error(
          `GraphQL Query Error - mediaItems: ${
            error instanceof Error ? error.message : error
          }`
        );
        throw error;
      }
    },

    mediaItem: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      try {
        // Validate ID format
        const numericId = parseInt(id);
        if (isNaN(numericId) || numericId <= 0) {
          logger.error(`Invalid ID format for mediaItem query: ${id}`);
          throw ApiError.badRequest(`Invalid media item ID format: ${id}`);
        }

        logger.debug(`GraphQL Query: mediaItem with ID ${numericId}`);
        const item = await getMediaItemById(context.prisma, numericId);

        if (!item) {
          logger.debug(
            `GraphQL Query: mediaItem with ID ${numericId} not found`
          );
          throw ApiError.notFound(`Media item with ID ${numericId} not found`);
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
      { input }: { input: any },
      context: GraphQLContext
    ) => {
      try {
        logger.debug(
          `GraphQL Mutation: createMediaItem for workspace ${input?.workspaceId}`
        );

        // Validate input using Joi validator
        const validatedInput =
          GraphQLInputValidator.validateCreateMediaItem(input);

        // Validate that the workspace exists
        const workspace = await context.prisma.workspace.findUnique({
          where: { id: validatedInput.workspaceId },
        });

        if (!workspace) {
          logger.error(
            `Workspace with ID ${validatedInput.workspaceId} not found`
          );
          throw ApiError.notFound(
            `Workspace with ID ${validatedInput.workspaceId} not found`
          );
        }

        // Additional business logic validation
        if (validatedInput.type === "BILLBOARD") {
          // Validate that billboard has at least one face if faces are provided
          if (
            validatedInput.staticMediaFaces &&
            validatedInput.staticMediaFaces.length === 0
          ) {
            logger.warn("Billboard created without static media faces");
          }

          // Remove any routes that might have been passed (shouldn't happen with validation)
          if (validatedInput.routes) {
            logger.warn("Routes provided for BILLBOARD type - removing them");
            delete validatedInput.routes;
          }
        } else if (validatedInput.type === "STREET_POLE") {
          // Validate that street pole has at least one route if routes are provided
          if (validatedInput.routes && validatedInput.routes.length === 0) {
            logger.warn("Street pole created without routes");
          }

          // Remove any static media faces that might have been passed
          if (validatedInput.staticMediaFaces) {
            logger.warn(
              "Static media faces provided for STREET_POLE type - removing them"
            );
            delete validatedInput.staticMediaFaces;
          }
        }

        // Generate display ID with retry logic
        let displayId;
        let retryCount = 0;
        const MAX_RETRIES = 3;

        while (retryCount < MAX_RETRIES) {
          try {
            displayId = await generateWorkspaceScopedId(
              context.prisma,
              validatedInput.workspaceId,
              validatedInput.type
            );
            logger.debug(
              `Pre-generated displayId: ${displayId} for new media item (attempt ${
                retryCount + 1
              })`
            );

            // Check if this ID already exists
            const existingWithId = await context.prisma.mediaItem.findFirst({
              where: {
                workspaceId: validatedInput.workspaceId,
                displayId,
              },
            });

            if (!existingWithId) {
              break;
            }

            logger.warn(
              `DisplayId ${displayId} already exists for workspace ${validatedInput.workspaceId}, retrying...`
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

        // Add the displayId to the validated input
        const mediaItemData = {
          ...validatedInput,
          displayId,
        };

        logger.info(
          `Creating ${validatedInput.type} media item: ${validatedInput.name} with displayId: ${displayId}`
        );

        const result = await createMediaItem(context.prisma, mediaItemData);

        logger.info(
          `Successfully created media item with ID ${result.id} and displayId ${result.displayId}`
        );

        return result;
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
      { id, input }: { id: string; input: any },
      context: GraphQLContext
    ) => {
      try {
        // Validate ID format
        const numericId = parseInt(id);
        if (isNaN(numericId) || numericId <= 0) {
          logger.error(`Invalid ID format for updateMediaItem: ${id}`);
          throw ApiError.badRequest(`Invalid media item ID format: ${id}`);
        }

        logger.debug(`GraphQL Mutation: updateMediaItem with ID ${numericId}`);

        // Check if media item exists
        const existingItem = await getMediaItemById(context.prisma, numericId);
        if (!existingItem) {
          throw ApiError.notFound(`Media item with ID ${numericId} not found`);
        }

        // Validate input using Joi validator
        const validatedInput =
          GraphQLInputValidator.validateUpdateMediaItem(input);

        // Additional business logic validation based on existing media item type
        if (existingItem.type === "BILLBOARD") {
          if (validatedInput.routes) {
            logger.warn("Routes provided for BILLBOARD type - removing them");
            delete validatedInput.routes;
          }
        } else if (existingItem.type === "STREET_POLE") {
          if (validatedInput.staticMediaFaces) {
            logger.warn(
              "Static media faces provided for STREET_POLE type - removing them"
            );
            delete validatedInput.staticMediaFaces;
          }
        }

        logger.info(`Updating media item ${numericId}: ${existingItem.name}`);

        const result = await updateMediaItem(
          context.prisma,
          numericId,
          validatedInput
        );

        logger.info(`Successfully updated media item ${numericId}`);

        return result;
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
      context: GraphQLContext
    ) => {
      try {
        // Validate ID format
        const numericId = parseInt(id);
        if (isNaN(numericId) || numericId <= 0) {
          logger.error(`Invalid ID format for deleteMediaItem: ${id}`);
          throw ApiError.badRequest(`Invalid media item ID format: ${id}`);
        }

        logger.debug(`GraphQL Mutation: deleteMediaItem with ID ${numericId}`);

        // Check if media item exists
        const existingItem = await getMediaItemById(context.prisma, numericId);
        if (!existingItem) {
          throw ApiError.notFound(`Media item with ID ${numericId} not found`);
        }

        logger.info(
          `Deleting media item ${numericId}: ${existingItem.name} (${existingItem.displayId})`
        );

        const result = await deleteMediaItem(context.prisma, numericId);

        logger.info(`Successfully deleted media item ${numericId}`);

        return result;
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
    workspace: async (parent: MediaItem, _: any, context: GraphQLContext) => {
      try {
        const workspaceId =
          typeof parent.workspaceId === "string"
            ? parseInt(parent.workspaceId)
            : parent.workspaceId;

        // Validate workspace ID
        if (isNaN(workspaceId) || workspaceId <= 0) {
          logger.error(
            `Invalid workspace ID for MediaItem ${parent.id}: ${parent.workspaceId}`
          );
          throw ApiError.badRequest(
            `Invalid workspace ID: ${parent.workspaceId}`
          );
        }

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

    staticMediaFaces: async (
      parent: MediaItem,
      _: any,
      context: GraphQLContext
    ) => {
      try {
        if (parent.type !== "BILLBOARD") {
          logger.debug(
            `No staticMediaFaces for non-BILLBOARD media item ${parent.id}`
          );
          return null;
        }

        const mediaItemId =
          typeof parent.id === "string" ? parseInt(parent.id) : parent.id;

        // Validate media item ID
        if (isNaN(mediaItemId) || mediaItemId <= 0) {
          logger.error(
            `Invalid media item ID for staticMediaFaces resolver: ${parent.id}`
          );
          throw ApiError.badRequest(`Invalid media item ID: ${parent.id}`);
        }

        const faces = await context.prisma.staticMediaFace.findMany({
          where: { mediaItemId },
          orderBy: { faceNumber: "asc" },
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

    routes: async (parent: MediaItem, _: any, context: GraphQLContext) => {
      try {
        if (parent.type !== "STREET_POLE") {
          logger.debug(`No routes for non-STREET_POLE media item ${parent.id}`);
          return null;
        }

        const mediaItemId =
          typeof parent.id === "string" ? parseInt(parent.id) : parent.id;

        // Validate media item ID
        if (isNaN(mediaItemId) || mediaItemId <= 0) {
          logger.error(
            `Invalid media item ID for routes resolver: ${parent.id}`
          );
          throw ApiError.badRequest(`Invalid media item ID: ${parent.id}`);
        }

        const routes = await context.prisma.route.findMany({
          where: { mediaItemId },
          orderBy: { routeName: "asc" },
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
