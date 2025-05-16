// src/models/staticMediaFaceModel.ts
import {
  PrismaClient,
  StaticMediaFace as PrismaStaticMediaFace,
} from "@prisma/client";
import logger from "../utils/logger";
import { ApiError } from "../middleware/errorHandler";
import { handlePrismaError } from "../utils/prismaErrorHandler";

export async function getStaticMediaFacesByMediaItemId(
  prisma: PrismaClient,
  mediaItemId: number
): Promise<PrismaStaticMediaFace[]> {
  try {
    logger.info(`Fetching static media faces for media item ID ${mediaItemId}`);

    // Verify media item exists
    const mediaItem = await prisma.mediaItem.findUnique({
      where: { id: mediaItemId },
    });

    if (!mediaItem) {
      logger.error(
        `Cannot fetch static media faces: Media item with ID ${mediaItemId} not found`
      );
      throw ApiError.notFound(`Media item with ID ${mediaItemId} not found`);
    }

    // Check if media item is a BILLBOARD
    if (mediaItem.type !== "BILLBOARD") {
      logger.warn(
        `Attempted to fetch static media faces for non-BILLBOARD media item ${mediaItemId} (type: ${mediaItem.type})`
      );
    }

    const faces = await prisma.staticMediaFace.findMany({
      where: { mediaItemId },
    });

    logger.info(
      `Found ${faces.length} static media faces for media item ID ${mediaItemId}`
    );
    return faces;
  } catch (error) {
    logger.error(
      `Error fetching static media faces for media item ${mediaItemId}: ${
        error instanceof Error ? error.message : error
      }`
    );

    if (error instanceof ApiError) {
      throw error;
    }

    return handlePrismaError(
      error,
      `fetching static media faces for media item ${mediaItemId}`
    );
  }
}

export async function createStaticMediaFace(
  prisma: PrismaClient,
  input: {
    mediaItemId: number;
    faceNumber: number;
    description?: string;
    availability?: string;
    images?: string[]; // Array input
    rent?: number;
  }
): Promise<PrismaStaticMediaFace> {
  try {
    logger.info(
      `Creating new static media face #${input.faceNumber} for media item ID ${input.mediaItemId}`
    );

    // Validate input
    if (input.faceNumber <= 0) {
      logger.error(`Invalid face number: ${input.faceNumber}`);
      throw ApiError.badRequest("Face number must be positive");
    }

    if (input.rent !== undefined && input.rent < 0) {
      logger.error(`Invalid rent amount: ${input.rent}`);
      throw ApiError.badRequest("Rent amount cannot be negative");
    }

    // Check if media item exists and is a BILLBOARD
    const mediaItem = await prisma.mediaItem.findUnique({
      where: { id: input.mediaItemId },
    });

    if (!mediaItem) {
      logger.error(
        `Cannot create static media face: Media item with ID ${input.mediaItemId} not found`
      );
      throw ApiError.notFound(
        `Media item with ID ${input.mediaItemId} not found`
      );
    }

    if (mediaItem.type !== "BILLBOARD") {
      logger.error(
        `Cannot create static media face: Media item ${input.mediaItemId} is not a BILLBOARD`
      );
      throw ApiError.badRequest(
        `Static media faces can only be created for BILLBOARD media items`
      );
    }

    // Check if a face with the same number already exists for this media item
    const existingFace = await prisma.staticMediaFace.findFirst({
      where: {
        mediaItemId: input.mediaItemId,
        faceNumber: input.faceNumber,
      },
    });

    if (existingFace) {
      logger.error(
        `Static media face with number ${input.faceNumber} already exists for media item ${input.mediaItemId}`
      );
      throw ApiError.badRequest(
        `Face number ${input.faceNumber} already exists for this billboard`
      );
    }

    // Convert images array to JSON string if it exists
    const imagesJson = input.images ? JSON.stringify(input.images) : null;

    // Create the static media face
    const face = await prisma.staticMediaFace.create({
      data: {
        mediaItemId: input.mediaItemId,
        faceNumber: input.faceNumber,
        description: input.description,
        availability: input.availability,
        imagesJson, // Store as JSON string
        rent: input.rent,
      },
    });

    logger.info(
      `Created new static media face with ID ${face.id} for media item ID ${input.mediaItemId}`
    );
    return face;
  } catch (error) {
    logger.error(
      `Error creating static media face #${input.faceNumber} for media item ${
        input.mediaItemId
      }: ${error instanceof Error ? error.message : error}`
    );

    if (error instanceof ApiError) {
      throw error;
    }

    return handlePrismaError(
      error,
      `creating static media face #${input.faceNumber}`
    );
  }
}

export async function updateStaticMediaFace(
  prisma: PrismaClient,
  id: number,
  input: {
    faceNumber?: number;
    description?: string;
    availability?: string;
    images?: string[]; // Array input
    rent?: number;
  }
): Promise<PrismaStaticMediaFace> {
  try {
    logger.info(`Updating static media face with ID ${id}`);

    // Check if static media face exists
    const existingFace = await prisma.staticMediaFace.findUnique({
      where: { id },
    });

    if (!existingFace) {
      logger.error(`Static media face with ID ${id} not found`);
      throw ApiError.notFound(`Static media face with ID ${id} not found`);
    }

    // Validate input
    if (input.faceNumber !== undefined && input.faceNumber <= 0) {
      logger.error(`Invalid face number: ${input.faceNumber}`);
      throw ApiError.badRequest("Face number must be positive");
    }

    if (input.rent !== undefined && input.rent < 0) {
      logger.error(`Invalid rent amount: ${input.rent}`);
      throw ApiError.badRequest("Rent amount cannot be negative");
    }

    // If changing face number, check for conflicts
    if (
      input.faceNumber !== undefined &&
      input.faceNumber !== existingFace.faceNumber
    ) {
      const conflictingFace = await prisma.staticMediaFace.findFirst({
        where: {
          mediaItemId: existingFace.mediaItemId,
          faceNumber: input.faceNumber,
          id: { not: id }, // Exclude current face
        },
      });

      if (conflictingFace) {
        logger.error(
          `Static media face with number ${input.faceNumber} already exists for media item ${existingFace.mediaItemId}`
        );
        throw ApiError.badRequest(
          `Face number ${input.faceNumber} already exists for this billboard`
        );
      }
    }

    // Prepare data for update
    const data: any = { ...input };

    // Handle images array conversion
    if (input.images) {
      data.imagesJson = JSON.stringify(input.images);
      delete data.images; // Remove the original array
    }

    // If no fields to update, return existing face
    if (Object.keys(data).length === 0) {
      logger.warn(`No fields to update for static media face ${id}`);
      return existingFace;
    }

    // Update static media face
    const face = await prisma.staticMediaFace.update({
      where: { id },
      data,
    });

    logger.info(`Updated static media face with ID ${face.id}`);
    return face;
  } catch (error) {
    logger.error(
      `Error updating static media face with ID ${id}: ${
        error instanceof Error ? error.message : error
      }`
    );

    if (error instanceof ApiError) {
      throw error;
    }

    return handlePrismaError(error, `updating static media face ${id}`);
  }
}

export async function deleteStaticMediaFace(
  prisma: PrismaClient,
  id: number
): Promise<boolean> {
  try {
    logger.info(`Deleting static media face with ID ${id}`);

    // Check if static media face exists
    const existingFace = await prisma.staticMediaFace.findUnique({
      where: { id },
    });

    if (!existingFace) {
      logger.warn(
        `Attempted to delete non-existent static media face with ID ${id}`
      );
      throw ApiError.notFound(`Static media face with ID ${id} not found`);
    }

    // Delete static media face
    await prisma.staticMediaFace.delete({ where: { id } });

    logger.info(`Successfully deleted static media face with ID ${id}`);
    return true;
  } catch (error) {
    logger.error(
      `Error deleting static media face with ID ${id}: ${
        error instanceof Error ? error.message : error
      }`
    );

    if (error instanceof ApiError) {
      throw error;
    }

    return handlePrismaError(error, `deleting static media face ${id}`);
  }
}
