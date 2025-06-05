import { Request, Response, NextFunction } from "express";
import { isCelebrateError } from "celebrate";
import logger from "../utils/logger";

export const validationErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Use celebrate's built-in error checking function
  if (isCelebrateError(error)) {
    logger.error("Validation Error:", {
      path: req.path,
      method: req.method,
      body: req.body,
      errors: error.details,
    });

    const validationErrors: any[] = [];

    // Celebrate errors have a Map of validation details
    error.details.forEach((value, key) => {
      value.details.forEach((detail: any) => {
        validationErrors.push({
          field: detail.path.join("."),
          message: detail.message,
          value: detail.context?.value,
          segment: key, // 'body', 'params', 'query', etc.
        });
      });
    });

    res.status(400).json({
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      errors: validationErrors,
    });
    return; // Important: don't call next() when handling the error
  }

  // If it's not a celebrate error, pass it to the next error handler
  next(error);
};
