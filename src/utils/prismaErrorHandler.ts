//src/utils/prismaErrorHandler.ts
import { Prisma } from "@prisma/client";
import logger from "./logger";
import { ApiError } from "../middleware/errorHandler";

interface ErrorInfo {
  code: string;
  message: string;
  status: number;
}

/**
 * Handles common Prisma errors and converts them to ApiErrors
 * @param error The error caught from Prisma operations
 * @param context Additional context for the error
 */
export function handlePrismaError(error: unknown, context?: string): never {
  // Log the original error with context
  const contextInfo = context ? ` ${context}` : "";
  logger.error(
    `Prisma Error${contextInfo}: ${
      error instanceof Error ? error.stack : error
    }`
  );

  // Handle Prisma specific errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const errorInfo = getPrismaErrorInfo(error);
    throw new ApiError(errorInfo.status, errorInfo.message, errorInfo.code);
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    throw ApiError.badRequest(
      `Validation error: ${error.message.split("\n").pop()}`
    );
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    logger.error("CRITICAL: Prisma client Rust panic:", error);
    throw ApiError.internal("A critical database error occurred");
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    logger.error("CRITICAL: Prisma client initialization error:", error);
    throw ApiError.internal("Database connection could not be established");
  }

  // For unknown errors, preserve the original error but wrap it
  if (error instanceof Error) {
    throw ApiError.internal(`Database operation failed: ${error.message}`);
  }

  // For anything else
  throw ApiError.internal("An unknown database error occurred");
}

/**
 * Maps Prisma error codes to user-friendly messages and status codes
 */
function getPrismaErrorInfo(
  error: Prisma.PrismaClientKnownRequestError
): ErrorInfo {
  // Extract field names from meta for more detailed error messages
  const meta = error.meta as { target?: string[] };
  const fields = meta && meta.target ? meta.target.join(", ") : "field";

  switch (error.code) {
    case "P2002":
      // Unique constraint violation
      return {
        code: "UNIQUE_CONSTRAINT_VIOLATION",
        message: `A record with this ${fields} already exists`,
        status: 400,
      };

    case "P2003":
      return {
        code: "FOREIGN_KEY_CONSTRAINT_VIOLATION",
        message: `The referenced ${fields} does not exist`,
        status: 400,
      };

    case "P2025":
      return {
        code: "RECORD_NOT_FOUND",
        message: "Record not found",
        status: 404,
      };

    case "P2001":
      return {
        code: "RECORD_NOT_FOUND",
        message: "Record does not exist",
        status: 404,
      };

    case "P2005":
    case "P2006":
      return {
        code: "INVALID_FIELD_VALUE",
        message: "Invalid field value provided",
        status: 400,
      };

    case "P2010":
      return {
        code: "RAW_QUERY_ERROR",
        message: "Raw query error",
        status: 400,
      };

    case "P2022":
      return {
        code: "COLUMN_NOT_FOUND",
        message: `Column ${fields} does not exist in the database`,
        status: 400,
      };

    case "P2000":
      return {
        code: "VALUE_TOO_LONG",
        message: `The provided value for ${fields} is too long`,
        status: 400,
      };

    default:
      return {
        code: `PRISMA_ERROR_${error.code}`,
        message: `Database operation failed: ${error.message}`,
        status: 500,
      };
  }
}
