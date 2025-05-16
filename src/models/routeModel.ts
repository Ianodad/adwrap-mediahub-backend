// src/models/route.ts
import { PrismaClient, Route as PrismaRoute } from "@prisma/client";
import logger from "../utils/logger";
import { ApiError } from "../middleware/errorHandler";
import { handlePrismaError } from "../utils/prismaErrorHandler";

export async function getRoutesByMediaItemId(
  prisma: PrismaClient,
  mediaItemId: number
): Promise<PrismaRoute[]> {
  try {
    logger.info(`Fetching routes for media item ID ${mediaItemId}`);

    // Verify media item exists
    const mediaItem = await prisma.mediaItem.findUnique({
      where: { id: mediaItemId },
    });

    if (!mediaItem) {
      logger.error(
        `Cannot fetch routes: Media item with ID ${mediaItemId} not found`
      );
      throw ApiError.notFound(`Media item with ID ${mediaItemId} not found`);
    }

    // Check if media item is a STREET_POLE
    if (mediaItem.type !== "STREET_POLE") {
      logger.warn(
        `Attempted to fetch routes for non-STREET_POLE media item ${mediaItemId} (type: ${mediaItem.type})`
      );
    }

    const routes = await prisma.route.findMany({
      where: { mediaItemId },
    });

    logger.info(
      `Found ${routes.length} routes for media item ID ${mediaItemId}`
    );
    return routes;
  } catch (error) {
    logger.error(
      `Error fetching routes for media item ${mediaItemId}: ${
        error instanceof Error ? error.message : error
      }`
    );

    if (error instanceof ApiError) {
      throw error;
    }

    return handlePrismaError(
      error,
      `fetching routes for media item ${mediaItemId}`
    );
  }
}

export async function createRoute(
  prisma: PrismaClient,
  input: {
    mediaItemId: number;
    routeName: string;
    sideRoute?: string;
    description?: string;
    numberOfStreetPoles?: number;
    pricePerStreetPole?: number;
    images?: string[]; // Array input
  }
): Promise<PrismaRoute> {
  try {
    logger.info(
      `Creating new route "${input.routeName}" for media item ID ${input.mediaItemId}`
    );

    // Validate input
    if (!input.routeName || input.routeName.trim() === "") {
      logger.error("Invalid route name: Route name cannot be empty");
      throw ApiError.badRequest("Route name cannot be empty");
    }

    // Check if media item exists and is a STREET_POLE
    const mediaItem = await prisma.mediaItem.findUnique({
      where: { id: input.mediaItemId },
    });

    if (!mediaItem) {
      logger.error(
        `Cannot create route: Media item with ID ${input.mediaItemId} not found`
      );
      throw ApiError.notFound(
        `Media item with ID ${input.mediaItemId} not found`
      );
    }

    if (mediaItem.type !== "STREET_POLE") {
      logger.error(
        `Cannot create route: Media item ${input.mediaItemId} is not a STREET_POLE`
      );
      throw ApiError.badRequest(
        `Routes can only be created for STREET_POLE media items`
      );
    }

    // Validate numbers are positive
    if (
      input.numberOfStreetPoles !== undefined &&
      input.numberOfStreetPoles <= 0
    ) {
      logger.error(
        `Invalid number of street poles: ${input.numberOfStreetPoles}`
      );
      throw ApiError.badRequest("Number of street poles must be positive");
    }

    if (
      input.pricePerStreetPole !== undefined &&
      input.pricePerStreetPole < 0
    ) {
      logger.error(
        `Invalid price per street pole: ${input.pricePerStreetPole}`
      );
      throw ApiError.badRequest("Price per street pole cannot be negative");
    }

    // Convert images array to JSON string if it exists
    const imagesJson = input.images ? JSON.stringify(input.images) : null;

    // Create the route
    const route = await prisma.route.create({
      data: {
        mediaItemId: input.mediaItemId,
        routeName: input.routeName,
        sideRoute: input.sideRoute,
        description: input.description,
        numberOfStreetPoles: input.numberOfStreetPoles,
        pricePerStreetPole: input.pricePerStreetPole,
        imagesJson,
      },
    });

    logger.info(
      `Created new route with ID ${route.id} for media item ID ${input.mediaItemId}`
    );
    return route;
  } catch (error) {
    logger.error(
      `Error creating route "${input.routeName}": ${
        error instanceof Error ? error.message : error
      }`
    );

    if (error instanceof ApiError) {
      throw error;
    }

    return handlePrismaError(error, `creating route "${input.routeName}"`);
  }
}

export async function updateRoute(
  prisma: PrismaClient,
  id: number,
  input: {
    routeName?: string;
    sideRoute?: string;
    description?: string;
    numberOfStreetPoles?: number;
    pricePerStreetPole?: number;
    images?: string[]; // Array input
  }
): Promise<PrismaRoute> {
  try {
    logger.info(`Updating route with ID ${id}`);

    // Check if route exists
    const existingRoute = await prisma.route.findUnique({
      where: { id },
    });

    if (!existingRoute) {
      logger.error(`Route with ID ${id} not found`);
      throw ApiError.notFound(`Route with ID ${id} not found`);
    }

    // Validate input
    if (input.routeName !== undefined && input.routeName.trim() === "") {
      logger.error("Invalid route name: Route name cannot be empty");
      throw ApiError.badRequest("Route name cannot be empty");
    }

    if (
      input.numberOfStreetPoles !== undefined &&
      input.numberOfStreetPoles <= 0
    ) {
      logger.error(
        `Invalid number of street poles: ${input.numberOfStreetPoles}`
      );
      throw ApiError.badRequest("Number of street poles must be positive");
    }

    if (
      input.pricePerStreetPole !== undefined &&
      input.pricePerStreetPole < 0
    ) {
      logger.error(
        `Invalid price per street pole: ${input.pricePerStreetPole}`
      );
      throw ApiError.badRequest("Price per street pole cannot be negative");
    }

    // Prepare data for update
    const data: any = {};

    // Only include fields that exist in the schema and were provided in input
    if (input.routeName !== undefined) data.routeName = input.routeName;
    if (input.sideRoute !== undefined) data.sideRoute = input.sideRoute;
    if (input.description !== undefined) data.description = input.description;
    if (input.numberOfStreetPoles !== undefined)
      data.numberOfStreetPoles = input.numberOfStreetPoles;
    if (input.pricePerStreetPole !== undefined)
      data.pricePerStreetPole = input.pricePerStreetPole;
    if (input.images !== undefined)
      data.imagesJson = JSON.stringify(input.images);

    // If no fields to update, return existing route
    if (Object.keys(data).length === 0) {
      logger.warn(`No fields to update for route ${id}`);
      return existingRoute;
    }

    // Update route
    const route = await prisma.route.update({
      where: { id },
      data,
    });

    logger.info(`Updated route with ID ${route.id}`);
    return route;
  } catch (error) {
    logger.error(
      `Error updating route with ID ${id}: ${
        error instanceof Error ? error.message : error
      }`
    );

    if (error instanceof ApiError) {
      throw error;
    }

    return handlePrismaError(error, `updating route ${id}`);
  }
}

export async function deleteRoute(
  prisma: PrismaClient,
  id: number
): Promise<boolean> {
  try {
    logger.info(`Deleting route with ID ${id}`);

    // Check if route exists
    const existingRoute = await prisma.route.findUnique({
      where: { id },
    });

    if (!existingRoute) {
      logger.warn(`Attempted to delete non-existent route with ID ${id}`);
      throw ApiError.notFound(`Route with ID ${id} not found`);
    }

    // Delete route
    await prisma.route.delete({ where: { id } });

    logger.info(`Successfully deleted route with ID ${id}`);
    return true;
  } catch (error) {
    logger.error(
      `Error deleting route with ID ${id}: ${
        error instanceof Error ? error.message : error
      }`
    );

    if (error instanceof ApiError) {
      throw error;
    }

    return handlePrismaError(error, `deleting route ${id}`);
  }
}
