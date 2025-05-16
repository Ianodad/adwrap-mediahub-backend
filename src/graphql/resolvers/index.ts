// src/graphql/resolvers/index.ts
import { mediaItemResolvers } from "./mediaItemResolver";
import { workspaceResolvers } from "./workspaceResolver";
import { staticMediaFaceResolvers } from "./staticMediaFaceResolver";
import { routeResolvers } from "./routeResolver";
import { dateTimeScalar } from "../scalars/dateTime"; // Updated import path

// Merge resolvers into a single object
export const resolvers = {
  DateTime: dateTimeScalar, // Add the DateTime scalar resolver

  Query: {
    ...mediaItemResolvers.Query,
    ...workspaceResolvers.Query,
    ...staticMediaFaceResolvers.Query,
    ...routeResolvers.Query,
  },
  Mutation: {
    ...mediaItemResolvers.Mutation,
    ...workspaceResolvers.Mutation,
    ...staticMediaFaceResolvers.Mutation,
    ...routeResolvers.Mutation,
  },
  // Type resolvers
  MediaItem: mediaItemResolvers.MediaItem,
  Workspace: workspaceResolvers.Workspace,
  StaticMediaFace: staticMediaFaceResolvers?.StaticMediaFace,
  Route: routeResolvers?.Route,
};
