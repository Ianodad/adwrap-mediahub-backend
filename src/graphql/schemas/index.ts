// src/graphql/schemas/index.ts
import { gql } from "apollo-server-express";
import fs from "fs";
import path from "path";

// Define base schema with Query and Mutation types
const baseSchema = gql`
  scalar DateTime

  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }
`;

// Read schema files
const schemaFiles = [
  "workspace.gql",
  "mediaItem.gql",
  "staticMediaFace.gql",
  "route.gql",
];

const typeDefsArray = schemaFiles.map((file) => {
  const filePath = path.join(__dirname, file);
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    console.error(`Error reading schema file ${file}:`, error);
    return "";
  }
});

// Combine all schemas
export const typeDefs = [
  baseSchema,
  ...typeDefsArray.map(
    (def) =>
      gql`
        ${def}
      `
  ),
];
