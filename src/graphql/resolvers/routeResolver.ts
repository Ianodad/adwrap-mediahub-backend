// src/graphql/resolvers/routeResolver.ts
import { Route } from "../schemas/generated-types";
import {
  getRoutesByMediaItemId,
  createRoute,
  updateRoute,
  deleteRoute,
} from "../../models/routeModel";
import { GraphQLInputValidator } from "../../validators";
import logger from "../../utils/logger";
import { ApiError } from "../../middleware/errorHandler";
import { GraphQLContext } from "../../types/shared";

export const routeResolvers = {
  Query: {
    routes: async (
      _: any,
      { mediaItemId }: { mediaItemId: number },
      context: GraphQLContext
    ) => {
      try {
        // Validate mediaItemId
        if (!Number.isInteger(mediaItemId) || mediaItemId <= 0) {
          logger.error(
            `Invalid media item ID for routes query: ${mediaItemId}`
          );
          throw ApiError.badRequest("Media item ID must be a positive integer");
        }

        logger.debug(`GraphQL Query: routes for media item ${mediaItemId}`);

        // Verify media item exists and is a STREET_POLE
        const mediaItem = await context.prisma.mediaItem.findUnique({
          where: { id: mediaItemId },
        });

        if (!mediaItem) {
          logger.error(
            `Media item with ID ${mediaItemId} not found for routes query`
          );
          throw ApiError.notFound(
            `Media item with ID ${mediaItemId} not found`
          );
        }

        if (mediaItem.type !== "STREET_POLE") {
          logger.warn(
            `Attempted to fetch routes for non-STREET_POLE media item ${mediaItemId} (type: ${mediaItem.type})`
          );
          // Return empty array instead of throwing error for better UX
          return [];
        }

        const routes = await getRoutesByMediaItemId(
          context.prisma,
          mediaItemId
        );

        logger.info(
          `Found ${routes.length} routes for media item ${mediaItemId}`
        );

        return routes;
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
      { input }: { input: any },
      context: GraphQLContext
    ) => {
      try {
        logger.debug(
          `GraphQL Mutation: createRoute "${input?.routeName}" for media item ${input?.mediaItemId}`
        );

        // Validate input using Joi validator
        const validatedInput = GraphQLInputValidator.validateCreateRoute(input);

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

        if (mediaItem.type !== "STREET_POLE") {
          logger.error(
            `Cannot create route for non-STREET_POLE media item ${validatedInput.mediaItemId}`
          );
          throw ApiError.badRequest(
            `Routes can only be created for STREET_POLE media items`
          );
        }

        // Check for duplicate route names within the same media item
        const existingRoute = await context.prisma.route.findFirst({
          where: {
            mediaItemId: validatedInput.mediaItemId,
            routeName: validatedInput.routeName,
          },
        });

        if (existingRoute) {
          logger.error(
            `Route with name "${validatedInput.routeName}" already exists for media item ${validatedInput.mediaItemId}`
          );
          throw ApiError.badRequest(
            `Route with name "${validatedInput.routeName}" already exists for this street pole`
          );
        }

        // Validate business logic for pricing
        if (
          validatedInput.numberOfStreetPoles &&
          validatedInput.pricePerStreetPole &&
          validatedInput.numberOfStreetPoles > 100
        ) {
          logger.warn(
            `Large number of street poles (${validatedInput.numberOfStreetPoles}) for route "${validatedInput.routeName}"`
          );
        }

        logger.info(
          `Creating route "${validatedInput.routeName}" for street pole ${mediaItem.displayId}`
        );

        const result = await createRoute(context.prisma, validatedInput);

        logger.info(`Successfully created route with ID ${result.id}`);

        return result;
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
      { id, input }: { id: string; input: any },
      context: GraphQLContext
    ) => {
      try {
        // Validate ID format
        const numericId = parseInt(id);
        if (isNaN(numericId) || numericId <= 0) {
          logger.error(`Invalid ID format for updateRoute: ${id}`);
          throw ApiError.badRequest(`Invalid route ID format: ${id}`);
        }

        logger.debug(`GraphQL Mutation: updateRoute with ID ${numericId}`);

        // Check if route exists
        const existingRoute = await context.prisma.route.findUnique({
          where: { id: numericId },
          include: { mediaItem: true },
        });

        if (!existingRoute) {
          logger.error(`Route with ID ${numericId} not found`);
          throw ApiError.notFound(`Route with ID ${numericId} not found`);
        }

        // Validate input using Joi validator
        const validatedInput = GraphQLInputValidator.validateUpdateRoute(input);

        // Additional validation for route name conflicts
        if (
          validatedInput.routeName !== undefined &&
          validatedInput.routeName !== existingRoute.routeName
        ) {
          const conflictingRoute = await context.prisma.route.findFirst({
            where: {
              mediaItemId: existingRoute.mediaItemId,
              routeName: validatedInput.routeName,
              id: { not: numericId },
            },
          });

          if (conflictingRoute) {
            logger.error(
              `Route name "${validatedInput.routeName}" already exists for media item ${existingRoute.mediaItemId}`
            );
            throw ApiError.badRequest(
              `Route name "${validatedInput.routeName}" already exists for this street pole`
            );
          }
        }

        // Validate business logic
        if (
          validatedInput.numberOfStreetPoles &&
          validatedInput.numberOfStreetPoles > 100
        ) {
          logger.warn(
            `Large number of street poles (${validatedInput.numberOfStreetPoles}) for route ${numericId}`
          );
        }

        logger.info(
          `Updating route ${numericId} ("${existingRoute.routeName}") for street pole ${existingRoute.mediaItem.displayId}`
        );

        const result = await updateRoute(
          context.prisma,
          numericId,
          validatedInput
        );

        logger.info(`Successfully updated route ${numericId}`);

        return result;
      } catch (error) {
        logger.error(
          `GraphQL Mutation Error - updateRoute: ${
            error instanceof Error ? error.message : error
          }`
        );
        throw error;
      }
    },

    deleteRoute: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      try {
        // Validate ID format
        const numericId = parseInt(id);
        if (isNaN(numericId) || numericId <= 0) {
          logger.error(`Invalid ID format for deleteRoute: ${id}`);
          throw ApiError.badRequest(`Invalid route ID format: ${id}`);
        }

        logger.debug(`GraphQL Mutation: deleteRoute with ID ${numericId}`);

        // Check if route exists
        const existingRoute = await context.prisma.route.findUnique({
          where: { id: numericId },
          include: { mediaItem: true },
        });

        if (!existingRoute) {
          logger.error(`Route with ID ${numericId} not found`);
          throw ApiError.notFound(`Route with ID ${numericId} not found`);
        }

        logger.info(
          `Deleting route ${numericId} ("${existingRoute.routeName}") from street pole ${existingRoute.mediaItem.displayId}`
        );

        const result = await deleteRoute(context.prisma, numericId);

        logger.info(`Successfully deleted route ${numericId}`);

        return result;
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
    mediaItem: async (parent: Route, _: any, context: GraphQLContext) => {
      try {
        // Validate media item ID
        const mediaItemId =
          typeof parent.mediaItemId === "string"
            ? parseInt(parent.mediaItemId)
            : parent.mediaItemId;

        if (isNaN(mediaItemId) || mediaItemId <= 0) {
          logger.error(
            `Invalid media item ID for Route ${parent.id}: ${parent.mediaItemId}`
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
            `Media item with ID ${mediaItemId} not found for Route ${parent.id}`
          );
          throw ApiError.notFound(
            `Media item with ID ${mediaItemId} not found`
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

    // Resolver to convert JSON string to array
    images: (parent: any) => {
      try {
        if (!parent.imagesJson) return [];

        try {
          const parsed = JSON.parse(parent.imagesJson);
          // Validate that parsed result is an array
          if (!Array.isArray(parsed)) {
            logger.warn(
              `Invalid images format for Route ${
                parent.id
              }: expected array, got ${typeof parsed}`
            );
            return [];
          }

          // Validate that all items in the array are strings (URLs)
          const validImages = parsed.filter((item) => {
            if (typeof item !== "string") {
              logger.warn(
                `Invalid image format in Route ${
                  parent.id
                }: expected string, got ${typeof item}`
              );
              return false;
            }
            return true;
          });

          if (validImages.length !== parsed.length) {
            logger.warn(
              `Filtered out ${
                parsed.length - validImages.length
              } invalid images for Route ${parent.id}`
            );
          }

          return validImages;
        } catch (parseError) {
          logger.error(
            `Error parsing images JSON for Route ${parent.id}: ${
              parseError instanceof Error ? parseError.message : parseError
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
