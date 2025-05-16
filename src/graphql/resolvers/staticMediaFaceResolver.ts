// src/graphql/resolvers/staticMediaFace.ts
import { PrismaClient } from "@prisma/client";
import { StaticMediaFace } from "../schemas/generated-types";
import {
  getStaticMediaFacesByMediaItemId,
  createStaticMediaFace,
  updateStaticMediaFace,
  deleteStaticMediaFace,
} from "../../models/staticMediaFaceModel";
import logger from "../../utils/logger";
import { ApiError } from "../../middleware/errorHandler";

interface Context {
  prisma: PrismaClient;
}

export const staticMediaFaceResolvers = {
  Query: {
    staticMediaFaces: async (
      _: any,
      { mediaItemId }: { mediaItemId: number },
      context: Context
    ) => {
      try {
        logger.debug(
          `GraphQL Query: staticMediaFaces for media item ${mediaItemId}`
        );
        return await getStaticMediaFacesByMediaItemId(
          context.prisma,
          mediaItemId
        );
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
      {
        input,
      }: {
        input: {
          mediaItemId: number;
          faceNumber: number;
          description?: string;
          availability?: string;
          images?: string[];
          rent?: number;
        };
      },
      context: Context
    ) => {
      try {
        logger.debug(
          `GraphQL Mutation: createStaticMediaFace #${input.faceNumber} for media item ${input.mediaItemId}`
        );

        // Validate input
        if (input.faceNumber <= 0) {
          logger.error(
            `Invalid face number in GraphQL mutation: ${input.faceNumber}`
          );
          throw ApiError.badRequest("Face number must be positive");
        }

        return await createStaticMediaFace(context.prisma, input);
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
      {
        id,
        input,
      }: {
        id: string;
        input: {
          faceNumber?: number;
          description?: string;
          availability?: string;
          images?: string[];
          rent?: number;
        };
      },
      context: Context
    ) => {
      try {
        const numericId = parseInt(id);
        logger.debug(
          `GraphQL Mutation: updateStaticMediaFace with ID ${numericId}`
        );

        if (isNaN(numericId)) {
          logger.error(`Invalid ID format for updateStaticMediaFace: ${id}`);
          throw ApiError.badRequest(`Invalid ID format: ${id}`);
        }

        // Validate input - check that at least one field is being updated
        if (Object.keys(input).length === 0) {
          logger.error("Empty update payload for updateStaticMediaFace");
          throw ApiError.badRequest(
            "Update must include at least one field to modify"
          );
        }

        return await updateStaticMediaFace(context.prisma, numericId, input);
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
      context: Context
    ) => {
      try {
        const numericId = parseInt(id);
        logger.debug(
          `GraphQL Mutation: deleteStaticMediaFace with ID ${numericId}`
        );

        if (isNaN(numericId)) {
          logger.error(`Invalid ID format for deleteStaticMediaFace: ${id}`);
          throw ApiError.badRequest(`Invalid ID format: ${id}`);
        }

        return await deleteStaticMediaFace(context.prisma, numericId);
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
    mediaItem: async (parent: StaticMediaFace, _: any, context: Context) => {
      try {
        const mediaItem = await context.prisma.mediaItem.findUnique({
          where: { id: parent.mediaItemId },
        });

        if (!mediaItem) {
          logger.error(
            `Media item with ID ${parent.mediaItemId} not found for StaticMediaFace ${parent.id}`
          );
          throw ApiError.notFound(
            `Media item with ID ${parent.mediaItemId} not found`
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

    // Add this resolver to convert JSON string to array
    images: (parent: any) => {
      try {
        if (!parent.imagesJson) return [];

        try {
          return JSON.parse(parent.imagesJson);
        } catch (e) {
          logger.error(
            `Error parsing images JSON for StaticMediaFace ${parent.id}: ${
              e instanceof Error ? e.message : e
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
