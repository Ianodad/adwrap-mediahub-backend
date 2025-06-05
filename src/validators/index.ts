// src/validators/index.ts

import { celebrate, Joi, Segments } from "celebrate";

const idSchema = Joi.number().integer().positive().required();
const optionalIdSchema = Joi.number().integer().positive().optional();
const stringSchema = Joi.string().trim().min(1).max(255);
const optionalStringSchema = Joi.string()
  .trim()
  .min(1)
  .max(255)
  .optional()
  .allow("");
const emailSchema = Joi.string().email().optional().allow("");
const coordinateSchema = Joi.number().min(-90).max(90);
const longitudeSchema = Joi.number().min(-180).max(180);
const nonNegativeNumberSchema = Joi.number().min(0);

// Enum validation
const mediaTypeSchema = Joi.string()
  .valid("BILLBOARD", "STREET_POLE")
  .required();

// Complex validation schemas
const imagesArraySchema = Joi.array().items(Joi.string().uri()).optional();

// =====================================================
// WORKSPACE VALIDATORS
// =====================================================

export const createWorkspaceValidator = celebrate({
  [Segments.BODY]: Joi.object({
    input: Joi.object({
      name: stringSchema.required().messages({
        "string.empty": "Workspace name cannot be empty",
        "any.required": "Workspace name is required",
      }),
      email: emailSchema.messages({
        "string.email": "Please provide a valid email address",
      }),
      address: optionalStringSchema,
      location: optionalStringSchema,
    }).required(),
  }).required(),
});

export const updateWorkspaceValidator = celebrate({
  [Segments.PARAMS]: Joi.object({
    id: idSchema.messages({
      "number.positive": "Workspace ID must be a positive number",
      "any.required": "Workspace ID is required",
    }),
  }),
  [Segments.BODY]: Joi.object({
    input: Joi.object({
      name: optionalStringSchema.messages({
        "string.empty": "Workspace name cannot be empty",
      }),
      email: emailSchema.messages({
        "string.email": "Please provide a valid email address",
      }),
      address: optionalStringSchema,
      location: optionalStringSchema,
    })
      .min(1)
      .required()
      .messages({
        "object.min": "At least one field must be provided for update",
      }),
  }).required(),
});

export const deleteWorkspaceValidator = celebrate({
  [Segments.PARAMS]: Joi.object({
    id: idSchema.messages({
      "number.positive": "Workspace ID must be a positive number",
      "any.required": "Workspace ID is required",
    }),
  }),
});

export const getWorkspaceValidator = celebrate({
  [Segments.PARAMS]: Joi.object({
    id: idSchema.messages({
      "number.positive": "Workspace ID must be a positive number",
      "any.required": "Workspace ID is required",
    }),
  }),
});

// =====================================================
// MEDIA ITEM VALIDATORS
// =====================================================

const staticMediaFaceInlineSchema = Joi.object({
  faceNumber: Joi.number().integer().positive().required().messages({
    "number.positive": "Face number must be positive",
    "any.required": "Face number is required",
  }),
  description: optionalStringSchema,
  availability: optionalStringSchema,
  images: imagesArraySchema,
  rent: nonNegativeNumberSchema.optional().messages({
    "number.min": "Rent cannot be negative",
  }),
});

const routeInlineSchema = Joi.object({
  routeName: stringSchema.required().messages({
    "string.empty": "Route name cannot be empty",
    "any.required": "Route name is required",
  }),
  sideRoute: optionalStringSchema,
  description: optionalStringSchema,
  numberOfStreetPoles: Joi.number().integer().positive().optional().messages({
    "number.positive": "Number of street poles must be positive",
  }),
  pricePerStreetPole: nonNegativeNumberSchema.optional().messages({
    "number.min": "Price per street pole cannot be negative",
  }),
  images: imagesArraySchema,
});

export const createMediaItemValidator = celebrate({
  [Segments.BODY]: Joi.object({
    input: Joi.object({
      workspaceId: idSchema.messages({
        "number.positive": "Workspace ID must be a positive number",
        "any.required": "Workspace ID is required",
      }),
      type: mediaTypeSchema,
      name: stringSchema.required().messages({
        "string.empty": "Media item name cannot be empty",
        "any.required": "Media item name is required",
      }),
      format: optionalStringSchema,
      location: optionalStringSchema,
      latitude: coordinateSchema.optional().messages({
        "number.min": "Latitude must be between -90 and 90",
        "number.max": "Latitude must be between -90 and 90",
      }),
      longitude: longitudeSchema.optional().messages({
        "number.min": "Longitude must be between -180 and 180",
        "number.max": "Longitude must be between -180 and 180",
      }),
      closestLandmark: optionalStringSchema,
      availability: optionalStringSchema,
      staticMediaFaces: Joi.when("type", {
        is: "BILLBOARD",
        then: Joi.array().items(staticMediaFaceInlineSchema).optional(),
        otherwise: Joi.forbidden().messages({
          "any.unknown":
            "Static media faces can only be provided for BILLBOARD type",
        }),
      }),
      routes: Joi.when("type", {
        is: "STREET_POLE",
        then: Joi.array().items(routeInlineSchema).optional(),
        otherwise: Joi.forbidden().messages({
          "any.unknown": "Routes can only be provided for STREET_POLE type",
        }),
      }),
    }).required(),
  }).required(),
});

export const updateMediaItemValidator = celebrate({
  [Segments.PARAMS]: Joi.object({
    id: idSchema.messages({
      "number.positive": "Media item ID must be a positive number",
      "any.required": "Media item ID is required",
    }),
  }),
  [Segments.BODY]: Joi.object({
    input: Joi.object({
      name: optionalStringSchema.messages({
        "string.empty": "Media item name cannot be empty",
      }),
      format: optionalStringSchema,
      location: optionalStringSchema,
      latitude: coordinateSchema.optional().messages({
        "number.min": "Latitude must be between -90 and 90",
        "number.max": "Latitude must be between -90 and 90",
      }),
      longitude: longitudeSchema.optional().messages({
        "number.min": "Longitude must be between -180 and 180",
        "number.max": "Longitude must be between -180 and 180",
      }),
      closestLandmark: optionalStringSchema,
      availability: optionalStringSchema,
      staticMediaFaces: Joi.array()
        .items(
          staticMediaFaceInlineSchema.keys({
            id: optionalIdSchema, // Allow ID for updates
          })
        )
        .optional(),
      routes: Joi.array()
        .items(
          routeInlineSchema.keys({
            id: optionalIdSchema, // Allow ID for updates
          })
        )
        .optional(),
    })
      .min(1)
      .required()
      .messages({
        "object.min": "At least one field must be provided for update",
      }),
  }).required(),
});

export const deleteMediaItemValidator = celebrate({
  [Segments.PARAMS]: Joi.object({
    id: idSchema.messages({
      "number.positive": "Media item ID must be a positive number",
      "any.required": "Media item ID is required",
    }),
  }),
});

export const getMediaItemValidator = celebrate({
  [Segments.PARAMS]: Joi.object({
    id: idSchema.messages({
      "number.positive": "Media item ID must be a positive number",
      "any.required": "Media item ID is required",
    }),
  }),
});

export const getMediaItemsValidator = celebrate({
  [Segments.QUERY]: Joi.object({
    workspaceId: idSchema.messages({
      "number.positive": "Workspace ID must be a positive number",
      "any.required": "Workspace ID is required",
    }),
  }),
});

// =====================================================
// STATIC MEDIA FACE VALIDATORS
// =====================================================

export const createStaticMediaFaceValidator = celebrate({
  [Segments.BODY]: Joi.object({
    input: Joi.object({
      mediaItemId: idSchema.messages({
        "number.positive": "Media item ID must be a positive number",
        "any.required": "Media item ID is required",
      }),
      faceNumber: Joi.number().integer().positive().required().messages({
        "number.positive": "Face number must be positive",
        "any.required": "Face number is required",
      }),
      description: optionalStringSchema,
      availability: optionalStringSchema,
      images: imagesArraySchema,
      rent: nonNegativeNumberSchema.optional().messages({
        "number.min": "Rent cannot be negative",
      }),
    }).required(),
  }).required(),
});

export const updateStaticMediaFaceValidator = celebrate({
  [Segments.PARAMS]: Joi.object({
    id: idSchema.messages({
      "number.positive": "Static media face ID must be a positive number",
      "any.required": "Static media face ID is required",
    }),
  }),
  [Segments.BODY]: Joi.object({
    input: Joi.object({
      faceNumber: Joi.number().integer().positive().optional().messages({
        "number.positive": "Face number must be positive",
      }),
      description: optionalStringSchema,
      availability: optionalStringSchema,
      images: imagesArraySchema,
      rent: nonNegativeNumberSchema.optional().messages({
        "number.min": "Rent cannot be negative",
      }),
    })
      .min(1)
      .required()
      .messages({
        "object.min": "At least one field must be provided for update",
      }),
  }).required(),
});

export const deleteStaticMediaFaceValidator = celebrate({
  [Segments.PARAMS]: Joi.object({
    id: idSchema.messages({
      "number.positive": "Static media face ID must be a positive number",
      "any.required": "Static media face ID is required",
    }),
  }),
});

export const getStaticMediaFacesValidator = celebrate({
  [Segments.QUERY]: Joi.object({
    mediaItemId: idSchema.messages({
      "number.positive": "Media item ID must be a positive number",
      "any.required": "Media item ID is required",
    }),
  }),
});

// =====================================================
// ROUTE VALIDATORS
// =====================================================

export const createRouteValidator = celebrate({
  [Segments.BODY]: Joi.object({
    input: Joi.object({
      mediaItemId: idSchema.messages({
        "number.positive": "Media item ID must be a positive number",
        "any.required": "Media item ID is required",
      }),
      routeName: stringSchema.required().messages({
        "string.empty": "Route name cannot be empty",
        "any.required": "Route name is required",
      }),
      sideRoute: optionalStringSchema,
      description: optionalStringSchema,
      numberOfStreetPoles: Joi.number()
        .integer()
        .positive()
        .optional()
        .messages({
          "number.positive": "Number of street poles must be positive",
        }),
      pricePerStreetPole: nonNegativeNumberSchema.optional().messages({
        "number.min": "Price per street pole cannot be negative",
      }),
      images: imagesArraySchema,
    }).required(),
  }).required(),
});

export const updateRouteValidator = celebrate({
  [Segments.PARAMS]: Joi.object({
    id: idSchema.messages({
      "number.positive": "Route ID must be a positive number",
      "any.required": "Route ID is required",
    }),
  }),
  [Segments.BODY]: Joi.object({
    input: Joi.object({
      routeName: optionalStringSchema.messages({
        "string.empty": "Route name cannot be empty",
      }),
      sideRoute: optionalStringSchema,
      description: optionalStringSchema,
      numberOfStreetPoles: Joi.number()
        .integer()
        .positive()
        .optional()
        .messages({
          "number.positive": "Number of street poles must be positive",
        }),
      pricePerStreetPole: nonNegativeNumberSchema.optional().messages({
        "number.min": "Price per street pole cannot be negative",
      }),
      images: imagesArraySchema,
    })
      .min(1)
      .required()
      .messages({
        "object.min": "At least one field must be provided for update",
      }),
  }).required(),
});

export const deleteRouteValidator = celebrate({
  [Segments.PARAMS]: Joi.object({
    id: idSchema.messages({
      "number.positive": "Route ID must be a positive number",
      "any.required": "Route ID is required",
    }),
  }),
});

export const getRoutesValidator = celebrate({
  [Segments.QUERY]: Joi.object({
    mediaItemId: idSchema.messages({
      "number.positive": "Media item ID must be a positive number",
      "any.required": "Media item ID is required",
    }),
  }),
});

// =====================================================
// CUSTOM VALIDATION FUNCTIONS
// =====================================================

/**
 * Custom validator for unique face numbers within staticMediaFaces array
 */
export const validateUniqueFaceNumbers = (staticMediaFaces: any[]) => {
  if (!staticMediaFaces || staticMediaFaces.length === 0) return true;

  const faceNumbers = staticMediaFaces.map((face) => face.faceNumber);
  const uniqueFaceNumbers = new Set(faceNumbers);

  if (faceNumbers.length !== uniqueFaceNumbers.size) {
    throw new Error("Duplicate face numbers are not allowed");
  }

  return true;
};

/**
 * Custom validator for coordinate pairs
 */
export const validateCoordinatePair = (
  latitude?: number,
  longitude?: number
) => {
  if (
    (latitude !== undefined && longitude === undefined) ||
    (latitude === undefined && longitude !== undefined)
  ) {
    throw new Error("Both latitude and longitude must be provided together");
  }
  return true;
};

// =====================================================
// CELEBRATE ERROR HANDLER
// =====================================================

export const celebrateErrorHandler = (
  err: any,
  res: any,
  next: any
) => {
  if (err.joi) {
    // Celebrate/Joi validation error
    const error = {
      message: "Validation Error",
      details: err.joi.details.map((detail: any) => ({
        field: detail.path.join("."),
        message: detail.message,
        value: detail.context?.value,
      })),
    };

    return res.status(400).json(error);
  }

  next(err);
};

// =====================================================
// GRAPHQL INPUT VALIDATORS (for use in resolvers)
// =====================================================

/**
 * Validates GraphQL input objects using Joi schemas
 */
export class GraphQLInputValidator {
  static validateCreateWorkspace(input: any) {
    const schema = Joi.object({
      name: stringSchema.required(),
      email: emailSchema,
      address: optionalStringSchema,
      location: optionalStringSchema,
    });

    const { error, value } = schema.validate(input);
    if (error) {
      throw new Error(`Validation Error: ${error.details[0].message}`);
    }
    return value;
  }

  static validateCreateMediaItem(input: any) {
    const schema = Joi.object({
      workspaceId: idSchema,
      type: mediaTypeSchema,
      name: stringSchema.required(),
      format: optionalStringSchema,
      location: optionalStringSchema,
      latitude: coordinateSchema.optional(),
      longitude: longitudeSchema.optional(),
      closestLandmark: optionalStringSchema,
      availability: optionalStringSchema,
      staticMediaFaces: Joi.when("type", {
        is: "BILLBOARD",
        then: Joi.array().items(staticMediaFaceInlineSchema).optional(),
        otherwise: Joi.forbidden(),
      }),
      routes: Joi.when("type", {
        is: "STREET_POLE",
        then: Joi.array().items(routeInlineSchema).optional(),
        otherwise: Joi.forbidden(),
      }),
    });

    const { error, value } = schema.validate(input);
    if (error) {
      throw new Error(`Validation Error: ${error.details[0].message}`);
    }

    // Additional custom validations
    if (value.latitude !== undefined || value.longitude !== undefined) {
      validateCoordinatePair(value.latitude, value.longitude);
    }

    if (value.staticMediaFaces) {
      validateUniqueFaceNumbers(value.staticMediaFaces);
    }

    return value;
  }

  static validateCreateStaticMediaFace(input: any) {
    const schema = Joi.object({
      mediaItemId: idSchema,
      faceNumber: Joi.number().integer().positive().required(),
      description: optionalStringSchema,
      availability: optionalStringSchema,
      images: imagesArraySchema,
      rent: nonNegativeNumberSchema.optional(),
    });

    const { error, value } = schema.validate(input);
    if (error) {
      throw new Error(`Validation Error: ${error.details[0].message}`);
    }
    return value;
  }

  static validateCreateRoute(input: any) {
    const schema = Joi.object({
      mediaItemId: idSchema,
      routeName: stringSchema.required(),
      sideRoute: optionalStringSchema,
      description: optionalStringSchema,
      numberOfStreetPoles: Joi.number().integer().positive().optional(),
      pricePerStreetPole: nonNegativeNumberSchema.optional(),
      images: imagesArraySchema,
    });

    const { error, value } = schema.validate(input);
    if (error) {
      throw new Error(`Validation Error: ${error.details[0].message}`);
    }
    return value;
  }

  // Update validators
  static validateUpdateWorkspace(input: any) {
    const schema = Joi.object({
      name: optionalStringSchema,
      email: emailSchema,
      address: optionalStringSchema,
      location: optionalStringSchema,
    }).min(1);

    const { error, value } = schema.validate(input);
    if (error) {
      throw new Error(`Validation Error: ${error.details[0].message}`);
    }
    return value;
  }

  static validateUpdateMediaItem(input: any) {
    const schema = Joi.object({
      name: optionalStringSchema,
      format: optionalStringSchema,
      location: optionalStringSchema,
      latitude: coordinateSchema.optional(),
      longitude: longitudeSchema.optional(),
      closestLandmark: optionalStringSchema,
      availability: optionalStringSchema,
      staticMediaFaces: Joi.array()
        .items(
          staticMediaFaceInlineSchema.keys({
            id: optionalIdSchema,
          })
        )
        .optional(),
      routes: Joi.array()
        .items(
          routeInlineSchema.keys({
            id: optionalIdSchema,
          })
        )
        .optional(),
    }).min(1);

    const { error, value } = schema.validate(input);
    if (error) {
      throw new Error(`Validation Error: ${error.details[0].message}`);
    }

    // Additional custom validations
    if (value.latitude !== undefined || value.longitude !== undefined) {
      validateCoordinatePair(value.latitude, value.longitude);
    }

    if (value.staticMediaFaces) {
      validateUniqueFaceNumbers(value.staticMediaFaces);
    }

    return value;
  }

  static validateUpdateStaticMediaFace(input: any) {
    const schema = Joi.object({
      faceNumber: Joi.number().integer().positive().optional(),
      description: optionalStringSchema,
      availability: optionalStringSchema,
      images: imagesArraySchema,
      rent: nonNegativeNumberSchema.optional(),
    }).min(1);

    const { error, value } = schema.validate(input);
    if (error) {
      throw new Error(`Validation Error: ${error.details[0].message}`);
    }
    return value;
  }

  static validateUpdateRoute(input: any) {
    const schema = Joi.object({
      routeName: optionalStringSchema,
      sideRoute: optionalStringSchema,
      description: optionalStringSchema,
      numberOfStreetPoles: Joi.number().integer().positive().optional(),
      pricePerStreetPole: nonNegativeNumberSchema.optional(),
      images: imagesArraySchema,
    }).min(1);

    const { error, value } = schema.validate(input);
    if (error) {
      throw new Error(`Validation Error: ${error.details[0].message}`);
    }
    return value;
  }
}

// =====================================================
// VALIDATION MIDDLEWARE FOR GRAPHQL RESOLVERS
// =====================================================

/**
 * Middleware function to validate GraphQL resolver inputs
 */
export const validateGraphQLInput = (validator: Function) => {
  return (resolver: Function) => {
    return async (parent: any, args: any, context: any, info: any) => {
      try {
        // Validate the input
        if (args.input) {
          args.input = validator(args.input);
        }

        // Call the original resolver
        return await resolver(parent, args, context, info);
      } catch (error) {
        throw error;
      }
    };
  };
};
