// src/graphql/scalars/dateTime.ts
import { GraphQLScalarType, Kind } from "graphql";

export const dateTimeScalar = new GraphQLScalarType({
  name: "DateTime",
  description: "DateTime scalar type",

  // Fix: Update serialize to handle unknown input
  serialize(value: unknown) {
    // Check if value is a valid Date
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === "string") {
      // Try to parse string to date
      return new Date(value).toISOString();
    }
    if (typeof value === "number") {
      // Handle timestamp numbers
      return new Date(value).toISOString();
    }
    throw new Error(`Value is not a valid Date: ${value}`);
  },

  parseValue(value: unknown) {
    if (typeof value === "string") {
      return new Date(value);
    }
    throw new Error(`Value is not a valid ISO date string: ${value}`);
  },

  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    if (ast.kind === Kind.INT) {
      return new Date(parseInt(ast.value, 10));
    }
    return null;
  },
});
