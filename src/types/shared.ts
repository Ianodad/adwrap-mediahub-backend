// src/graphql/types/shared.ts
import { PrismaClient } from "@prisma/client";

// Shared context interface for all resolvers
export interface GraphQLContext {
  prisma: PrismaClient;
}

// Shared resolver types
export interface ResolverParent {
  id: string | number;
  [key: string]: any;
}

export interface ResolverArgs {
  id?: string;
  input?: any;
  workspaceId?: number;
  mediaItemId?: number;
  [key: string]: any;
}

// Generic resolver function type
export type ResolverFunction<TResult = any, TParent = any, TArgs = any> = (
  parent: TParent,
  args: TArgs,
  context: GraphQLContext,
  info?: any
) => Promise<TResult> | TResult;

// Query resolver types
export interface QueryResolvers {
  [key: string]: ResolverFunction;
}

// Mutation resolver types
export interface MutationResolvers {
  [key: string]: ResolverFunction;
}

// Type resolver types
export interface TypeResolvers {
  [key: string]: ResolverFunction | any;
}

// Validation result type
export interface ValidationResult<T = any> {
  isValid: boolean;
  data?: T;
  errors?: string[];
}

// Common entity types
export interface EntityWithId {
  id: string | number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Media item related types
export interface MediaItemBase extends EntityWithId {
  workspaceId: number;
  type: "BILLBOARD" | "STREET_POLE";
  displayId: string;
  name: string;
  format?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  closestLandmark?: string;
  availability?: string;
}

// Workspace related types
export interface WorkspaceBase extends EntityWithId {
  name: string;
  email?: string;
  address?: string;
  location?: string;
}

// Static media face types
export interface StaticMediaFaceBase extends EntityWithId {
  mediaItemId: number;
  faceNumber: number;
  description?: string;
  availability?: string;
  images?: string[];
  rent?: number;
}

// Route types
export interface RouteBase extends EntityWithId {
  mediaItemId: number;
  routeName: string;
  sideRoute?: string;
  description?: string;
  numberOfStreetPoles?: number;
  pricePerStreetPole?: number;
  images?: string[];
}