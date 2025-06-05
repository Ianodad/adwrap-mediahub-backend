// src/graphql/resolvers/staticMediaFaceResolver.ts
import { StaticMediaFace } from "../schemas/generated-types";
import {
  getStaticMediaFacesByMediaItemId,
  createStaticMediaFace,
  updateStaticMediaFace,
  deleteStaticMediaFace,
} from "../../models/staticMediaFaceModel";
import { GraphQLInputValidator } from "../../validators";
import logger from "../../utils/logger";
import { ApiError } from "../../middleware/errorHandler";
import { GraphQLContext } from "../../types/shared";

export const staticMediaFaceResolvers = {
  Query: {
    staticMediaFaces: async (
      _: any,
      { mediaItemId }: { mediaItemId: number },
      context: GraphQLContext
    ) => {
      try {
        // Validate mediaItemId
        if (!Number.isInteger(mediaItemId) || mediaItemId <= 0) {
          logger.error(
            `Invalid media item ID for staticMediaFaces query: ${mediaItemId}`
          );
          throw ApiError.badRequest("Media item ID must be a positive integer");
        }

        logger.debug(
          `GraphQL Query: staticMediaFaces for media item ${mediaItemId}`
        );

        // Verify media item exists and is a BILLBOARD
        const mediaItem = await context.prisma.mediaItem.findUnique({
          where: { id: mediaItemId },
        });

        if (!mediaItem) {
          logger.error(
            `Media item with ID ${mediaItemId} not found for staticMediaFaces query`
          );
          throw ApiError.notFound(
            `Media item with ID ${mediaItemId} not found`
          );
        }

        if (mediaItem.type !== "BILLBOARD") {
          logger.warn(
            `Attempted to fetch static media faces for non-BILLBOARD media item ${mediaItemId} (type: ${mediaItem.type})`
          );
          // Return empty array instead of throwing error for better UX
          return [];
        }

        const faces = await getStaticMediaFacesByMediaItemId(
          context.prisma,
          mediaItemId
        );

        logger.info(
          `Found ${faces.length} static media faces for media item ${mediaItemId}`
        );

        return faces;
      } catch (error) {
        logger.error(
          `GraphQL Query Error - staticMediaFaces: ${
            error instanceof Error ? error.message : error
          }`
        );
        throw error;
      }
    },
  },

  Mutation: {
    createStaticMediaFace: async (
      _: any,
      { input }: { input: any },
      context: GraphQLContext
    ) => {
      try {
        logger.debug(
          `GraphQL Mutation: createStaticMediaFace #${input?.faceNumber} for media item ${input?.mediaItemId}`
        );

        // Validate input using Joi validator
        const validatedInput =
          GraphQLInputValidator.validateCreateStaticMediaFace(input);

        // Additional business logic validation
        const mediaItem = await context.prisma.mediaItem.findUnique({
          where: { id: validatedInput.mediaItemId },
        });

        if (!mediaItem) {
          logger.error(
            `Media item with ID ${validatedInput.mediaItemId} not found`
          );
          throw ApiError.notFound(
            `Media item with ID ${validatedInput.mediaItemId} not found`
          );
        }

        if (mediaItem.type !== "BILLBOARD") {
          logger.error(
            `Cannot create static media face for non-BILLBOARD media item ${validatedInput.mediaItemId}`
          );
          throw ApiError.badRequest(
            `Static media faces can only be created for BILLBOARD media items`
          );
        }

        // Check for duplicate face numbers
        const existingFace = await context.prisma.staticMediaFace.findFirst({
          where: {
            mediaItemId: validatedInput.mediaItemId,
            faceNumber: validatedInput.faceNumber,
          },
        });

        if (existingFace) {
          logger.error(
            `Static media face with number ${validatedInput.faceNumber} already exists for media item ${validatedInput.mediaItemId}`
          );
          throw ApiError.badRequest(
            `Face number ${validatedInput.faceNumber} already exists for this billboard`
          );
        }

        logger.info(
          `Creating static media face #${validatedInput.faceNumber} for billboard ${mediaItem.displayId}`
        );

        const result = await createStaticMediaFace(
          context.prisma,
          validatedInput
        );

        logger.info(
          `Successfully created static media face with ID ${result.id}`
        );

        return result;
      } catch (error) {
        logger.error(
          `GraphQL Mutation Error - createStaticMediaFace: ${
            error instanceof Error ? error.message : error
          }`
        );
        throw error;
      }
    },

    updateStaticMediaFace: async (
      _: any,
      { id, input }: { id: string; input: any },
      context: GraphQLContext
    ) => {
      try {
        // Validate ID format
        const numericId = parseInt(id);
        if (isNaN(numericId) || numericId <= 0) {
          logger.error(`Invalid ID format for updateStaticMediaFace: ${id}`);
          throw ApiError.badRequest(
            `Invalid static media face ID format: ${id}`
          );
        }

        logger.debug(
          `GraphQL Mutation: updateStaticMediaFace with ID ${numericId}`
        );

        // Check if static media face exists
        const existingFace = await context.prisma.staticMediaFace.findUnique({
          where: { id: numericId },
          include: { mediaItem: true },
        });

        if (!existingFace) {
          logger.error(`Static media face with ID ${numericId} not found`);
          throw ApiError.notFound(
            `Static media face with ID ${numericId} not found`
          );
        }

        // Validate input using Joi validator
        const validatedInput =
          GraphQLInputValidator.validateUpdateStaticMediaFace(input);

        // Additional validation for face number conflicts
        if (
          validatedInput.faceNumber !== undefined &&
          validatedInput.faceNumber !== existingFace.faceNumber
        ) {
          const conflictingFace =
            await context.prisma.staticMediaFace.findFirst({
              where: {
                mediaItemId: existingFace.mediaItemId,
                faceNumber: validatedInput.faceNumber,
                id: { not: numericId },
              },
            });

          if (conflictingFace) {
            logger.error(
              `Face number ${validatedInput.faceNumber} already exists for media item ${existingFace.mediaItemId}`
            );
            throw ApiError.badRequest(
              `Face number ${validatedInput.faceNumber} already exists for this billboard`
            );
          }
        }

        logger.info(
          `Updating static media face ${numericId} for billboard ${existingFace.mediaItem.displayId}`
        );

        const result = await updateStaticMediaFace(
          context.prisma,
          numericId,
          validatedInput
        );

        logger.info(`Successfully updated static media face ${numericId}`);

        return result;
      } catch (error) {
        logger.error(
          `GraphQL Mutation Error - updateStaticMediaFace: ${
            error instanceof Error ? error.message : error
          }`
        );
        throw error;
      }
    },

    deleteStaticMediaFace: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      try {
        // Validate ID format
        const numericId = parseInt(id);
        if (isNaN(numericId) || numericId <= 0) {
          logger.error(`Invalid ID format for deleteStaticMediaFace: ${id}`);
          throw ApiError.badRequest(
            `Invalid static media face ID format: ${id}`
          );
        }

        logger.debug(
          `GraphQL Mutation: deleteStaticMediaFace with ID ${numericId}`
        );

        // Check if static media face exists
        const existingFace = await context.prisma.staticMediaFace.findUnique({
          where: { id: numericId },
          include: { mediaItem: true },
        });

        if (!existingFace) {
          logger.error(`Static media face with ID ${numericId} not found`);
          throw ApiError.notFound(
            `Static media face with ID ${numericId} not found`
          );
        }

        logger.info(
          `Deleting static media face ${numericId} (face #${existingFace.faceNumber}) from billboard ${existingFace.mediaItem.displayId}`
        );

        const result = await deleteStaticMediaFace(context.prisma, numericId);

        logger.info(`Successfully deleted static media face ${numericId}`);

        return result;
      } catch (error) {
        logger.error(
          `GraphQL Mutation Error - deleteStaticMediaFace: ${
            error instanceof Error ? error.message : error
          }`
        );
        throw error;
      }
    },
  },

  StaticMediaFace: {
    mediaItem: async (
      parent: StaticMediaFace,
      _: any,
      context: GraphQLContext
    ) => {
      try {
        // Validate media item ID
        const mediaItemId =
          typeof parent.mediaItemId === "string"
            ? parseInt(parent.mediaItemId)
            : parent.mediaItemId;

        if (isNaN(mediaItemId) || mediaItemId <= 0) {
          logger.error(
            `Invalid media item ID for StaticMediaFace ${parent.id}: ${parent.mediaItemId}`
          );
          throw ApiError.badRequest(
            `Invalid media item ID: ${parent.mediaItemId}`
          );
        }

        const mediaItem = await context.prisma.mediaItem.findUnique({
          where: { id: mediaItemId },
        });

        if (!mediaItem) {
          logger.error(
            `Media item with ID ${mediaItemId} not found for StaticMediaFace ${parent.id}`
          );
          throw ApiError.notFound(
            `Media item with ID ${mediaItemId} not found`
          );
        }

        return mediaItem;
      } catch (error) {
        logger.error(
          `Error resolving mediaItem for StaticMediaFace ${parent.id}: ${
            error instanceof Error ? error.message : error
          }`
        );
        throw error;
      }
    },

    // Resolver to convert JSON string to array
    images: (parent: any) => {
      try {
        if (!parent.imagesJson) return [];

        try {
          const parsed = JSON.parse(parent.imagesJson);
          // Validate that parsed result is an array
          if (!Array.isArray(parsed)) {
            logger.warn(
              `Invalid images format for StaticMediaFace ${
                parent.id
              }: expected array, got ${typeof parsed}`
            );
            return [];
          }
          return parsed;
        } catch (parseError) {
          logger.error(
            `Error parsing images JSON for StaticMediaFace ${parent.id}: ${
              parseError instanceof Error ? parseError.message : parseError
            }`
          );
          return [];
        }
      } catch (error) {
        logger.error(
          `Error resolving images for StaticMediaFace ${parent.id}: ${
            error instanceof Error ? error.message : error
          }`
        );
        return [];
      }
    },
  },
};
