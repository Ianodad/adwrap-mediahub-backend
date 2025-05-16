// src/graphql/resolvers/workspaceResolver.ts
import { PrismaClient } from "@prisma/client";
import { Workspace } from "../schemas/generated-types";
import {
  createWorkspace,
  getWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
} from "../../models/workspaceModel";
import logger from "../../utils/logger";
import { ApiError } from "../../middleware/errorHandler";

interface Context {
  prisma: PrismaClient;
}

export const workspaceResolvers = {
  Query: {
    workspaces: async (_: any, __: any, context: Context) => {
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

    workspace: async (_: any, { id }: { id: string }, context: Context) => {
      try {
        const numericId = parseInt(id);
        logger.debug(`GraphQL Query: workspace with ID ${numericId}`);

        if (isNaN(numericId)) {
          logger.error(`Invalid ID format for workspace query: ${id}`);
          throw ApiError.badRequest(`Invalid ID format: ${id}`);
        }

        const workspace = await getWorkspaceById(context.prisma, numericId);

        if (!workspace) {
          logger.debug(
            `GraphQL Query: workspace with ID ${numericId} not found`
          );
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
      {
        input,
      }: {
        input: {
          name: string;
          email?: string;
          address?: string;
          location?: string;
        };
      },
      context: Context
    ) => {
      try {
        logger.debug(`GraphQL Mutation: createWorkspace "${input.name}"`);

        // Validate input
        if (!input.name || input.name.trim() === "") {
          logger.error(
            "Invalid workspace name in GraphQL mutation: Name cannot be empty"
          );
          throw ApiError.badRequest("Workspace name cannot be empty");
        }

        return await createWorkspace(context.prisma, input);
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
      {
        id,
        input,
      }: {
        id: string;
        input: {
          name?: string;
          email?: string;
          address?: string;
          location?: string;
        };
      },
      context: Context
    ) => {
      try {
        const numericId = parseInt(id);
        logger.debug(`GraphQL Mutation: updateWorkspace with ID ${numericId}`);

        if (isNaN(numericId)) {
          logger.error(`Invalid ID format for updateWorkspace: ${id}`);
          throw ApiError.badRequest(`Invalid ID format: ${id}`);
        }

        // Validate input - check that at least one field is being updated
        if (Object.keys(input).length === 0) {
          logger.error("Empty update payload for updateWorkspace");
          throw ApiError.badRequest(
            "Update must include at least one field to modify"
          );
        }

        return await updateWorkspace(context.prisma, numericId, input);
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
      context: Context
    ) => {
      try {
        const numericId = parseInt(id);
        logger.debug(`GraphQL Mutation: deleteWorkspace with ID ${numericId}`);

        if (isNaN(numericId)) {
          logger.error(`Invalid ID format for deleteWorkspace: ${id}`);
          throw ApiError.badRequest(`Invalid ID format: ${id}`);
        }

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
    mediaItems: async (parent: Workspace, _: any, context: Context) => {
      try {
        // Convert the workspace ID to a number if it's a string
        const workspaceId =
          typeof parent.id === "string" ? parseInt(parent.id) : parent.id;

        const mediaItems = await context.prisma.mediaItem.findMany({
          where: { workspaceId },
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
