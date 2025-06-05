// src/graphql/resolvers/index.ts
import { mediaItemResolvers } from "./mediaItemResolver";
import { workspaceResolvers } from "./workspaceResolver";
import { staticMediaFaceResolvers } from "./staticMediaFaceResolver";
import { routeResolvers } from "./routeResolver";
import { dateTimeScalar } from "../scalars/dateTime";
import logger from "../../utils/logger";
// import { GraphQLContext } from "../../types/shared";

// Log resolver initialization
logger.info("Initializing GraphQL resolvers with validation");

// Merge resolvers into a single object
export const resolvers = {
  DateTime: dateTimeScalar, // Add the DateTime scalar resolver

  Query: {
    // Merge all query resolvers
    ...mediaItemResolvers.Query,
    ...workspaceResolvers.Query,
    ...staticMediaFaceResolvers.Query,
    ...routeResolvers.Query,
  },

  Mutation: {
    // Merge all mutation resolvers
    ...mediaItemResolvers.Mutation,
    ...workspaceResolvers.Mutation,
    ...staticMediaFaceResolvers.Mutation,
    ...routeResolvers.Mutation,
  },

  // Type resolvers for complex field resolution
  MediaItem: mediaItemResolvers.MediaItem,
  Workspace: workspaceResolvers.Workspace,
  StaticMediaFace: staticMediaFaceResolvers.StaticMediaFace,
  Route: routeResolvers.Route,
};

// Log successful resolver initialization
logger.info("GraphQL resolvers initialized successfully with validation");

// Export individual resolvers for testing purposes
export {
  mediaItemResolvers,
  workspaceResolvers,
  staticMediaFaceResolvers,
  routeResolvers,
};


// Validation helper functions that can be used across resolvers
export const resolverHelpers = {
  /**
   * Validates and parses a string ID to number
   */
  validateAndParseId: (id: string, entityName: string = "entity"): number => {
    const numericId = parseInt(id);
    if (isNaN(numericId) || numericId <= 0) {
      logger.error(`Invalid ID format for ${entityName}: ${id}`);
      throw new Error(`Invalid ${entityName} ID format: ${id}`);
    }
    return numericId;
  },

  /**
   * Validates that a number is a positive integer
   */
  validatePositiveInteger: (value: any, fieldName: string): number => {
    if (!Number.isInteger(value) || value <= 0) {
      logger.error(`Invalid ${fieldName}: ${value} (must be positive integer)`);
      throw new Error(`${fieldName} must be a positive integer`);
    }
    return value;
  },

  /**
   * Safely parses JSON with error handling
   */
  safeJsonParse: (
    jsonString: string,
    fallback: any = [],
    entityName: string = "entity"
  ): any => {
    try {
      if (!jsonString) return fallback;
      const parsed = JSON.parse(jsonString);
      return parsed;
    } catch (error) {
      logger.error(
        `Error parsing JSON for ${entityName}: ${
          error instanceof Error ? error.message : error
        }`
      );
      return fallback;
    }
  },

  /**
   * Validates array of image URLs
   */
  validateImageArray: (images: any[], entityName: string): string[] => {
    if (!Array.isArray(images)) {
      logger.warn(`Invalid images format for ${entityName}: expected array`);
      return [];
    }

    const validImages = images.filter((image) => {
      if (typeof image !== "string") {
        logger.warn(
          `Invalid image format in ${entityName}: expected string URL`
        );
        return false;
      }
      return true;
    });

    if (validImages.length !== images.length) {
      logger.warn(
        `Filtered out ${
          images.length - validImages.length
        } invalid images for ${entityName}`
      );
    }

    return validImages;
  },
};
