// src/utils/idGenerator.ts
import { PrismaClient, MediaType } from "@prisma/client";
import logger from "./logger";
import { ApiError } from "../middleware/errorHandler";

export async function generateWorkspaceScopedId(
  prisma: PrismaClient,
  workspaceId: number,
  type: MediaType
): Promise<string> {
  try {
    logger.debug(`Generating ID for ${type} in workspace ${workspaceId}`);

    // First check if workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      logger.error(
        `Cannot generate ID: Workspace with ID ${workspaceId} not found`
      );
      throw ApiError.badRequest(`Workspace with ID ${workspaceId} not found`);
    }

    const prefix = type === "BILLBOARD" ? "BB" : "SP";

    // Use a transaction to ensure ID consistency even with concurrent requests
    return await prisma.$transaction(async (tx) => {
      try {
        // Find the highest existing display ID number
        const mediaItems = await tx.mediaItem.findMany({
          where: {
            workspaceId,
            type,
            displayId: {
              startsWith: `${prefix}-`,
            },
          },
          orderBy: {
            displayId: "desc",
          },
          take: 1,
        });

        let nextNumber = 1;

        if (mediaItems.length > 0) {
          // Extract the number from the highest display ID
          const currentDisplayId = mediaItems[0].displayId;
          const match = currentDisplayId.match(/^[A-Z]+-(\d+)$/);

          if (match && match[1]) {
            nextNumber = parseInt(match[1], 10) + 1;
          }
        }

        // Generate the next ID (e.g., BB-1, SP-1)
        const newId = `${prefix}-${nextNumber}`;

        // Double-check that this ID doesn't already exist (extra safety)
        const existing = await tx.mediaItem.findFirst({
          where: {
            workspaceId,
            displayId: newId,
          },
        });

        if (existing) {
          // If by some chance it exists, increment again
          nextNumber += 1;
          const nextId = `${prefix}-${nextNumber}`;
          logger.debug(
            `ID conflict detected. Generated alternative ID: ${nextId}`
          );
          return nextId;
        }

        logger.debug(
          `Generated ID: ${newId} for ${type} in workspace ${workspaceId}`
        );
        return newId;
      } catch (txError) {
        logger.error(
          `Transaction error generating ID: ${
            txError instanceof Error ? txError.message : txError
          }`
        );
        throw txError;
      }
    });
  } catch (error) {
    logger.error(
      `Error generating workspace-scoped ID: ${
        error instanceof Error ? error.message : error
      }`
    );

    // Specific error handling
    if (error instanceof Error && error.message.includes("Connection")) {
      throw ApiError.internal("Database connection error while generating ID");
    }

    throw error;
  }
}

// Add a new utility function to verify if an ID is valid
export function isValidMediaItemId(id: string, type: MediaType): boolean {
  try {
    const prefix = type === "BILLBOARD" ? "BB" : "SP";
    const pattern = new RegExp(`^${prefix}-\\d+$`);

    const isValid = pattern.test(id);

    if (!isValid) {
      logger.warn(`Invalid media item ID format: ${id} for type ${type}`);
    }

    return isValid;
  } catch (error) {
    logger.error(
      `Error validating media item ID: ${
        error instanceof Error ? error.message : error
      }`
    );
    return false;
  }
}
