// src/index.ts
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs } from "./graphql/schemas";
import { resolvers } from "./graphql/resolvers";
import { createContext } from "./graphql/context";
import { errorHandler } from "./middleware/errorHandler";
import { config } from "dotenv";
import logger from "./utils/logger";
import path from "path";
import fs from "fs";

config(); // Load environment variables from .env

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const app = express();

// Create GraphQL schema
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Middleware
app.use(express.json()); // Parse JSON bodies

// Request logging middleware
app.use((req, _res, next) => {
  logger.http(`${req.method} ${req.url}`);
  next();
});

// GraphQL error formatting
const formatError = (error: any) => {
  logger.error(`GraphQL Error: ${error.message}`, {
    path: error.path,
    extensions: error.extensions,
    stack: error.extensions?.exception?.stacktrace?.join("\n") || error.stack,
  });

  return {
    message: error.message,
    path: error.path,
    extensions: {
      code: error.extensions?.code || "INTERNAL_SERVER_ERROR",
      // Only return stacktrace in development mode
      ...(process.env.NODE_ENV !== "production" && {
        stacktrace: error.extensions?.exception?.stacktrace,
      }),
    },
  };
};

// Start Apollo Server and apply middleware
async function startServer() {
  try {
    // Create Apollo Server
    const apolloServer = new ApolloServer({
      schema,
      context: createContext,
      introspection: true,
      formatError,
    });

    // Start the server
    await apolloServer.start();
    logger.info("Apollo Server started successfully");

    // Apply middleware
    apolloServer.applyMiddleware({
      app: app as any,
      path: "/graphql",
    });
    logger.info(`Apollo middleware applied at /graphql`);

    // Global error handling middleware
    app.use(errorHandler);

    const PORT = process.env.PORT || 9001;
    app.listen(PORT, () => {
      logger.info(`🚀 Server running at http://localhost:${PORT}`);
      logger.info(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

startServer().catch((error) => {
  logger.error("Failed to start server:", error);
  process.exit(1);
});
