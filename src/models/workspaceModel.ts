// src/models/workspaceModel.ts
import { PrismaClient, Workspace as PrismaWorkspace } from "@prisma/client";
import logger from "../utils/logger";
import { ApiError } from "../middleware/errorHandler";
import { handlePrismaError } from "../utils/prismaErrorHandler";

export async function createWorkspace(
  prisma: PrismaClient,
  input: {
    name: string;
    email?: string;
    address?: string;
    location?: string;
  }
): Promise<PrismaWorkspace> {
  try {
    logger.info(`Creating new workspace: "${input.name}"`);

    // Validate input
    if (!input.name || input.name.trim() === "") {
      logger.error("Invalid workspace name: Name cannot be empty");
      throw ApiError.badRequest("Workspace name cannot be empty");
    }

    // Validate email format if provided
    if (input.email !== undefined && input.email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.email)) {
        logger.error(`Invalid email format: ${input.email}`);
        throw ApiError.badRequest("Invalid email format");
      }
    }

    // Create workspace without specifying ID, letting Prisma handle auto-increment
    // IMPORTANT: Never specify id here - let the database handle auto-incrementing
    const workspace = await prisma.workspace.create({
      data: {
        name: input.name,
        email: input.email || null,
        address: input.address || null,
        location: input.location || null,
      },
    });

    logger.info(
      `Created new workspace with ID ${workspace.id}: "${workspace.name}"`
    );
    return workspace;
  } catch (error) {
    logger.error(
      `Error creating workspace "${input.name}": ${
        error instanceof Error ? error.message : error
      }`
    );

    if (error instanceof ApiError) {
      throw error;
    }

    return handlePrismaError(error, `creating workspace "${input.name}"`);
  }
}

export async function getWorkspaces(
  prisma: PrismaClient
): Promise<PrismaWorkspace[]> {
  try {
    logger.info("Fetching all workspaces");

    const workspaces = await prisma.workspace.findMany({
      include: {
        mediaItems: true,
      },
    });

    logger.info(`Found ${workspaces.length} workspaces`);
    return workspaces;
  } catch (error) {
    logger.error(
      `Error fetching workspaces: ${
        error instanceof Error ? error.message : error
      }`
    );
    return handlePrismaError(error, "fetching workspaces");
  }
}

export async function getWorkspaceById(
  prisma: PrismaClient,
  id: number
): Promise<PrismaWorkspace | null> {
  try {
    logger.info(`Fetching workspace with ID ${id}`);

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        mediaItems: true,
      },
    });

    if (!workspace) {
      logger.warn(`Workspace with ID ${id} not found`);
      return null;
    }

    logger.info(`Found workspace with ID ${id}: "${workspace.name}"`);
    return workspace;
  } catch (error) {
    logger.error(
      `Error fetching workspace with ID ${id}: ${
        error instanceof Error ? error.message : error
      }`
    );
    return handlePrismaError(error, `fetching workspace ${id}`);
  }
}

export async function updateWorkspace(
  prisma: PrismaClient,
  id: number,
  input: {
    name?: string;
    email?: string;
    address?: string;
    location?: string;
  }
): Promise<PrismaWorkspace> {
  try {
    logger.info(`Updating workspace with ID ${id}`);

    // Check if workspace exists
    const existingWorkspace = await prisma.workspace.findUnique({
      where: { id },
    });

    if (!existingWorkspace) {
      logger.error(`Workspace with ID ${id} not found`);
      throw ApiError.notFound(`Workspace with ID ${id} not found`);
    }

    // Validate input
    if (input.name !== undefined && input.name.trim() === "") {
      logger.error("Invalid workspace name: Name cannot be empty");
      throw ApiError.badRequest("Workspace name cannot be empty");
    }

    // Validate email format if provided
    if (input.email !== undefined && input.email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.email)) {
        logger.error(`Invalid email format: ${input.email}`);
        throw ApiError.badRequest("Invalid email format");
      }
    }

    // Prepare data for update
    const data: any = {};

    // Only include fields that are provided in the input
    if (input.name !== undefined) data.name = input.name;
    if (input.email !== undefined) data.email = input.email;
    if (input.address !== undefined) data.address = input.address;
    if (input.location !== undefined) data.location = input.location;

    // If no fields to update, return existing workspace
    if (Object.keys(data).length === 0) {
      logger.warn(`No fields to update for workspace ${id}`);
      return existingWorkspace;
    }

    // Update workspace
    const workspace = await prisma.workspace.update({
      where: { id },
      data,
    });

    logger.info(
      `Updated workspace with ID ${workspace.id}: "${workspace.name}"`
    );
    return workspace;
  } catch (error) {
    logger.error(
      `Error updating workspace with ID ${id}: ${
        error instanceof Error ? error.message : error
      }`
    );

    if (error instanceof ApiError) {
      throw error;
    }

    return handlePrismaError(error, `updating workspace ${id}`);
  }
}

export async function deleteWorkspace(
  prisma: PrismaClient,
  id: number
): Promise<boolean> {
  try {
    logger.info(`Deleting workspace with ID ${id}`);

    // Check if workspace exists
    const existingWorkspace = await prisma.workspace.findUnique({
      where: { id },
    });

    if (!existingWorkspace) {
      logger.warn(`Attempted to delete non-existent workspace with ID ${id}`);
      throw ApiError.notFound(`Workspace with ID ${id} not found`);
    }

    // Check if workspace has media items
    const mediaItemCount = await prisma.mediaItem.count({
      where: { workspaceId: id },
    });

    if (mediaItemCount > 0) {
      logger.error(
        `Cannot delete workspace with ID ${id}: Contains ${mediaItemCount} media items`
      );
      throw ApiError.badRequest(
        `Cannot delete workspace that contains media items. Delete the media items first.`
      );
    }

    // Delete workspace
    await prisma.workspace.delete({ where: { id } });

    logger.info(`Successfully deleted workspace with ID ${id}`);
    return true;
  } catch (error) {
    logger.error(
      `Error deleting workspace with ID ${id}: ${
        error instanceof Error ? error.message : error
      }`
    );

    if (error instanceof ApiError) {
      throw error;
    }

    return handlePrismaError(error, `deleting workspace ${id}`);
  }
}
