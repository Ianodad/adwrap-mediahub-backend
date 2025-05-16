// src/graphql/resolvers/routeResolver.ts
import { PrismaClient } from "@prisma/client";
import { Route } from "../schemas/generated-types";
import {
  getRoutesByMediaItemId,
  createRoute,
  updateRoute,
  deleteRoute,
} from "../../models/routeModel";
import logger from "../../utils/logger";
import { ApiError } from "../../middleware/errorHandler";

interface Context {
  prisma: PrismaClient;
}

export const routeResolvers = {
  Query: {
    routes: async (
      _: any,
      { mediaItemId }: { mediaItemId: number },
      context: Context
    ) => {
      try {
        logger.debug(`GraphQL Query: routes for media item ${mediaItemId}`);
        return await getRoutesByMediaItemId(context.prisma, mediaItemId);
      } catch (error) {
        logger.error(
          `GraphQL Query Error - routes: ${
            error instanceof Error ? error.message : error
          }`
        );
        throw error;
      }
    },
  },

  Mutation: {
    createRoute: async (
      _: any,
      {
        input,
      }: {
        input: {
          mediaItemId: number;
          routeName: string;
          sideRoute?: string;
          description?: string;
          numberOfStreetPoles?: number;
          pricePerStreetPole?: number;
          images?: string[];
        };
      },
      context: Context
    ) => {
      try {
        logger.debug(
          `GraphQL Mutation: createRoute for media item ${input.mediaItemId}`
        );

        // Validate input
        if (!input.routeName || input.routeName.trim() === "") {
          logger.error(
            "Invalid route name in GraphQL mutation: Name cannot be empty"
          );
          throw ApiError.badRequest("Route name cannot be empty");
        }

        return await createRoute(context.prisma, input);
      } catch (error) {
        logger.error(
          `GraphQL Mutation Error - createRoute: ${
            error instanceof Error ? error.message : error
          }`
        );
        throw error;
      }
    },

    updateRoute: async (
      _: any,
      {
        id,
        input,
      }: {
        id: string;
        input: {
          routeName?: string;
          sideRoute?: string;
          description?: string;
          numberOfStreetPoles?: number;
          pricePerStreetPole?: number;
          images?: string[];
        };
      },
      context: Context
    ) => {
      try {
        const numericId = parseInt(id);
        logger.debug(`GraphQL Mutation: updateRoute with ID ${numericId}`);

        if (isNaN(numericId)) {
          logger.error(`Invalid ID format for updateRoute: ${id}`);
          throw ApiError.badRequest(`Invalid ID format: ${id}`);
        }

        // Validate input - check that at least one field is being updated
        if (Object.keys(input).length === 0) {
          logger.error("Empty update payload for updateRoute");
          throw ApiError.badRequest(
            "Update must include at least one field to modify"
          );
        }

        return await updateRoute(context.prisma, numericId, input);
      } catch (error) {
        logger.error(
          `GraphQL Mutation Error - updateRoute: ${
            error instanceof Error ? error.message : error
          }`
        );
        throw error;
      }
    },

    deleteRoute: async (_: any, { id }: { id: string }, context: Context) => {
      try {
        const numericId = parseInt(id);
        logger.debug(`GraphQL Mutation: deleteRoute with ID ${numericId}`);

        if (isNaN(numericId)) {
          logger.error(`Invalid ID format for deleteRoute: ${id}`);
          throw ApiError.badRequest(`Invalid ID format: ${id}`);
        }

        return await deleteRoute(context.prisma, numericId);
      } catch (error) {
        logger.error(
          `GraphQL Mutation Error - deleteRoute: ${
            error instanceof Error ? error.message : error
          }`
        );
        throw error;
      }
    },
  },

  Route: {
    mediaItem: async (parent: Route, _: any, context: Context) => {
      try {
        const mediaItem = await context.prisma.mediaItem.findUnique({
          where: { id: parent.mediaItemId },
        });

        if (!mediaItem) {
          logger.error(
            `Media item with ID ${parent.mediaItemId} not found for Route ${parent.id}`
          );
          throw ApiError.notFound(
            `Media item with ID ${parent.mediaItemId} not found`
          );
        }

        return mediaItem;
      } catch (error) {
        logger.error(
          `Error resolving mediaItem for Route ${parent.id}: ${
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
            `Error parsing images JSON for Route ${parent.id}: ${
              e instanceof Error ? e.message : e
            }`
          );
          return [];
        }
      } catch (error) {
        logger.error(
          `Error resolving images for Route ${parent.id}: ${
            error instanceof Error ? error.message : error
          }`
        );
        return [];
      }
    },
  },
};