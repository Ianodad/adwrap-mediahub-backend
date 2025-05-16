// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

interface ExtendedError extends Error {
  code?: string | number;
  statusCode?: number;
}

export const errorHandler = (
  err: ExtendedError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log the error with details
  logger.error(
    `${err.name}: ${err.message}\nStack: ${err.stack}\nPath: ${
      req.path
    }\nMethod: ${req.method}\nBody: ${JSON.stringify(req.body)}`
  );

  // Set appropriate status code
  const statusCode =
    err.statusCode || res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? "🥞" : err.stack,
    code: err.code || "INTERNAL_ERROR",
  });
};

// Helper to create errors with status code
export class ApiError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, message: string, code: string = "API_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  static notFound(message = "Resource not found") {
    return new ApiError(404, message, "NOT_FOUND");
  }

  static badRequest(message = "Bad request") {
    return new ApiError(400, message, "BAD_REQUEST");
  }

  static internal(message = "Internal server error") {
    return new ApiError(500, message, "INTERNAL_ERROR");
  }

  static forbidden(message = "Forbidden") {
    return new ApiError(403, message, "FORBIDDEN");
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message, "UNAUTHORIZED");
  }
}
