// src/graphql/resolvers/workspaceResolver.ts
import { Workspace } from "../schemas/generated-types";
import {
  createWorkspace,
  getWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
} from "../../models/workspaceModel";
import { GraphQLInputValidator } from "../../validators";
import logger from "../../utils/logger";
import { ApiError } from "../../middleware/errorHandler";
import { GraphQLContext } from "../../types/shared";

export const workspaceResolvers = {
  Query: {
    workspaces: async (_: any, __: any, context: GraphQLContext) => {
      try {
        logger.debug("GraphQL Query: workspaces");
        return await getWorkspaces(context.prisma);
      } catch (error) {
        logger.error(
          `GraphQL Query Error - workspaces: ${
            error instanceof Error ? error.message : error
          }`
        );
        throw error;
      }
    },

    workspace: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      try {
        // Validate ID format
        const numericId = parseInt(id);
        if (isNaN(numericId) || numericId <= 0) {
          logger.error(`Invalid ID format for workspace query: ${id}`);
          throw ApiError.badRequest(`Invalid workspace ID format: ${id}`);
        }

        logger.debug(`GraphQL Query: workspace with ID ${numericId}`);
        const workspace = await getWorkspaceById(context.prisma, numericId);

        if (!workspace) {
          logger.debug(
            `GraphQL Query: workspace with ID ${numericId} not found`
          );
          throw ApiError.notFound(`Workspace with ID ${numericId} not found`);
        }

        return workspace;
      } catch (error) {
        logger.error(
          `GraphQL Query Error - workspace: ${
            error instanceof Error ? error.message : error
          }`
        );
        throw error;
      }
    },
  },

  Mutation: {
    createWorkspace: async (
      _: any,
      { input }: { input: any },
      context: GraphQLContext
    ) => {
      try {
        logger.debug(`GraphQL Mutation: createWorkspace "${input?.name}"`);

        // Validate input using Joi validator
        const validatedInput =
          GraphQLInputValidator.validateCreateWorkspace(input);

        logger.info(
          `Creating workspace with validated input: ${validatedInput.name}`
        );
        return await createWorkspace(context.prisma, validatedInput);
      } catch (error) {
        logger.error(
          `GraphQL Mutation Error - createWorkspace: ${
            error instanceof Error ? error.message : error
          }`
        );
        throw error;
      }
    },

    updateWorkspace: async (
      _: any,
      { id, input }: { id: string; input: any },
      context: GraphQLContext
    ) => {
      try {
        // Validate ID format
        const numericId = parseInt(id);
        if (isNaN(numericId) || numericId <= 0) {
          logger.error(`Invalid ID format for updateWorkspace: ${id}`);
          throw ApiError.badRequest(`Invalid workspace ID format: ${id}`);
        }

        logger.debug(`GraphQL Mutation: updateWorkspace with ID ${numericId}`);

        // Validate input using Joi validator
        const validatedInput =
          GraphQLInputValidator.validateUpdateWorkspace(input);

        logger.info(`Updating workspace ${numericId} with validated input`);
        return await updateWorkspace(context.prisma, numericId, validatedInput);
      } catch (error) {
        logger.error(
          `GraphQL Mutation Error - updateWorkspace: ${
            error instanceof Error ? error.message : error
          }`
        );
        throw error;
      }
    },

    deleteWorkspace: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      try {
        // Validate ID format
        const numericId = parseInt(id);
        if (isNaN(numericId) || numericId <= 0) {
          logger.error(`Invalid ID format for deleteWorkspace: ${id}`);
          throw ApiError.badRequest(`Invalid workspace ID format: ${id}`);
        }

        logger.debug(`GraphQL Mutation: deleteWorkspace with ID ${numericId}`);

        // Check if workspace exists before deletion
        const existingWorkspace = await getWorkspaceById(
          context.prisma,
          numericId
        );
        if (!existingWorkspace) {
          throw ApiError.notFound(`Workspace with ID ${numericId} not found`);
        }

        logger.info(
          `Deleting workspace ${numericId}: ${existingWorkspace.name}`
        );
        return await deleteWorkspace(context.prisma, numericId);
      } catch (error) {
        logger.error(
          `GraphQL Mutation Error - deleteWorkspace: ${
            error instanceof Error ? error.message : error
          }`
        );
        throw error;
      }
    },
  },

  Workspace: {
    mediaItems: async (parent: Workspace, _: any, context: GraphQLContext) => {
      try {
        // Convert the workspace ID to a number if it's a string
        const workspaceId =
          typeof parent.id === "string" ? parseInt(parent.id) : parent.id;

        // Validate workspace ID
        if (isNaN(workspaceId) || workspaceId <= 0) {
          logger.error(
            `Invalid workspace ID for mediaItems resolver: ${parent.id}`
          );
          throw ApiError.badRequest(`Invalid workspace ID: ${parent.id}`);
        }

        const mediaItems = await context.prisma.mediaItem.findMany({
          where: { workspaceId },
          include: {
            staticMediaFaces: true,
            routes: true,
          },
        });

        logger.debug(
          `Found ${mediaItems.length} media items for Workspace ${workspaceId}`
        );
        return mediaItems;
      } catch (error) {
        logger.error(
          `Error resolving mediaItems for Workspace ${parent.id}: ${
            error instanceof Error ? error.message : error
          }`
        );
        throw error;
      }
    },
  },
};
