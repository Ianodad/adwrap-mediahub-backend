import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: Date | string; output: Date | string; }
};

export type CreateMediaItemInput = {
  availability?: InputMaybe<Scalars['String']['input']>;
  closestLandmark?: InputMaybe<Scalars['String']['input']>;
  format?: InputMaybe<Scalars['String']['input']>;
  latitude?: InputMaybe<Scalars['Float']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
  name: Scalars['String']['input'];
  routes?: InputMaybe<Array<CreateRouteInlineInput>>;
  staticMediaFaces?: InputMaybe<Array<CreateStaticMediaFaceInlineInput>>;
  type: MediaType;
  workspaceId: Scalars['Int']['input'];
};

export type CreateRouteInlineInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  images?: InputMaybe<Array<Scalars['String']['input']>>;
  numberOfStreetPoles?: InputMaybe<Scalars['Int']['input']>;
  pricePerStreetPole?: InputMaybe<Scalars['Float']['input']>;
  routeName: Scalars['String']['input'];
  sideRoute?: InputMaybe<Scalars['String']['input']>;
};

export type CreateRouteInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  images?: InputMaybe<Array<Scalars['String']['input']>>;
  mediaItemId: Scalars['Int']['input'];
  numberOfStreetPoles?: InputMaybe<Scalars['Int']['input']>;
  pricePerStreetPole?: InputMaybe<Scalars['Float']['input']>;
  routeName: Scalars['String']['input'];
  sideRoute?: InputMaybe<Scalars['String']['input']>;
};

export type CreateStaticMediaFaceInlineInput = {
  availability?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  faceNumber: Scalars['Int']['input'];
  images?: InputMaybe<Array<Scalars['String']['input']>>;
  rent?: InputMaybe<Scalars['Float']['input']>;
};

export type CreateStaticMediaFaceInput = {
  availability?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  faceNumber: Scalars['Int']['input'];
  images?: InputMaybe<Array<Scalars['String']['input']>>;
  mediaItemId: Scalars['Int']['input'];
  rent?: InputMaybe<Scalars['Float']['input']>;
};

export type CreateWorkspaceInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export type MediaItem = {
  __typename?: 'MediaItem';
  availability?: Maybe<Scalars['String']['output']>;
  closestLandmark?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  displayId: Scalars['String']['output'];
  format?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  latitude?: Maybe<Scalars['Float']['output']>;
  location?: Maybe<Scalars['String']['output']>;
  longitude?: Maybe<Scalars['Float']['output']>;
  name: Scalars['String']['output'];
  routes?: Maybe<Array<Route>>;
  staticMediaFaces?: Maybe<Array<StaticMediaFace>>;
  type: MediaType;
  updatedAt: Scalars['DateTime']['output'];
  workspace: Workspace;
  workspaceId: Scalars['Int']['output'];
};

export enum MediaType {
  Billboard = 'BILLBOARD',
  StreetPole = 'STREET_POLE'
}

export type Mutation = {
  __typename?: 'Mutation';
  _empty?: Maybe<Scalars['String']['output']>;
  createMediaItem: MediaItem;
  createRoute: Route;
  createStaticMediaFace: StaticMediaFace;
  createWorkspace: Workspace;
  deleteMediaItem: Scalars['Boolean']['output'];
  deleteRoute: Scalars['Boolean']['output'];
  deleteStaticMediaFace: Scalars['Boolean']['output'];
  deleteWorkspace: Scalars['Boolean']['output'];
  updateMediaItem: MediaItem;
  updateRoute: Route;
  updateStaticMediaFace: StaticMediaFace;
  updateWorkspace: Workspace;
};


export type MutationCreateMediaItemArgs = {
  input: CreateMediaItemInput;
};


export type MutationCreateRouteArgs = {
  input: CreateRouteInput;
};


export type MutationCreateStaticMediaFaceArgs = {
  input: CreateStaticMediaFaceInput;
};


export type MutationCreateWorkspaceArgs = {
  input: CreateWorkspaceInput;
};


export type MutationDeleteMediaItemArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteRouteArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteStaticMediaFaceArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteWorkspaceArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateMediaItemArgs = {
  id: Scalars['ID']['input'];
  input: UpdateMediaItemInput;
};


export type MutationUpdateRouteArgs = {
  id: Scalars['ID']['input'];
  input: UpdateRouteInput;
};


export type MutationUpdateStaticMediaFaceArgs = {
  id: Scalars['ID']['input'];
  input: UpdateStaticMediaFaceInput;
};


export type MutationUpdateWorkspaceArgs = {
  id: Scalars['ID']['input'];
  input: UpdateWorkspaceInput;
};

export type Query = {
  __typename?: 'Query';
  _empty?: Maybe<Scalars['String']['output']>;
  mediaItem?: Maybe<MediaItem>;
  mediaItems: Array<MediaItem>;
  routes: Array<Route>;
  staticMediaFaces: Array<StaticMediaFace>;
  workspace?: Maybe<Workspace>;
  workspaces: Array<Workspace>;
};


export type QueryMediaItemArgs = {
  id: Scalars['ID']['input'];
};


export type QueryMediaItemsArgs = {
  workspaceId: Scalars['Int']['input'];
};


export type QueryRoutesArgs = {
  mediaItemId: Scalars['Int']['input'];
};


export type QueryStaticMediaFacesArgs = {
  mediaItemId: Scalars['Int']['input'];
};


export type QueryWorkspaceArgs = {
  id: Scalars['ID']['input'];
};

export type Route = {
  __typename?: 'Route';
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  images?: Maybe<Array<Scalars['String']['output']>>;
  mediaItem: MediaItem;
  mediaItemId: Scalars['Int']['output'];
  numberOfStreetPoles?: Maybe<Scalars['Int']['output']>;
  pricePerStreetPole?: Maybe<Scalars['Float']['output']>;
  routeName: Scalars['String']['output'];
  sideRoute?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type StaticMediaFace = {
  __typename?: 'StaticMediaFace';
  availability?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  faceNumber: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  images?: Maybe<Array<Scalars['String']['output']>>;
  mediaItem: MediaItem;
  mediaItemId: Scalars['Int']['output'];
  rent?: Maybe<Scalars['Float']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type UpdateMediaItemInput = {
  availability?: InputMaybe<Scalars['String']['input']>;
  closestLandmark?: InputMaybe<Scalars['String']['input']>;
  format?: InputMaybe<Scalars['String']['input']>;
  latitude?: InputMaybe<Scalars['Float']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  routes?: InputMaybe<Array<UpdateRouteInput>>;
  staticMediaFaces?: InputMaybe<Array<UpdateStaticMediaFaceInput>>;
};

export type UpdateRouteInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  images?: InputMaybe<Array<Scalars['String']['input']>>;
  numberOfStreetPoles?: InputMaybe<Scalars['Int']['input']>;
  pricePerStreetPole?: InputMaybe<Scalars['Float']['input']>;
  routeName?: InputMaybe<Scalars['String']['input']>;
  sideRoute?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateStaticMediaFaceInput = {
  availability?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  faceNumber?: InputMaybe<Scalars['Int']['input']>;
  images?: InputMaybe<Array<Scalars['String']['input']>>;
  rent?: InputMaybe<Scalars['Float']['input']>;
};

export type UpdateWorkspaceInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type Workspace = {
  __typename?: 'Workspace';
  address?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  location?: Maybe<Scalars['String']['output']>;
  mediaItems: Array<MediaItem>;
  name: Scalars['String']['output'];
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  CreateMediaItemInput: CreateMediaItemInput;
  CreateRouteInlineInput: CreateRouteInlineInput;
  CreateRouteInput: CreateRouteInput;
  CreateStaticMediaFaceInlineInput: CreateStaticMediaFaceInlineInput;
  CreateStaticMediaFaceInput: CreateStaticMediaFaceInput;
  CreateWorkspaceInput: CreateWorkspaceInput;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  MediaItem: ResolverTypeWrapper<MediaItem>;
  MediaType: MediaType;
  Mutation: ResolverTypeWrapper<{}>;
  Query: ResolverTypeWrapper<{}>;
  Route: ResolverTypeWrapper<Route>;
  StaticMediaFace: ResolverTypeWrapper<StaticMediaFace>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  UpdateMediaItemInput: UpdateMediaItemInput;
  UpdateRouteInput: UpdateRouteInput;
  UpdateStaticMediaFaceInput: UpdateStaticMediaFaceInput;
  UpdateWorkspaceInput: UpdateWorkspaceInput;
  Workspace: ResolverTypeWrapper<Workspace>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Boolean: Scalars['Boolean']['output'];
  CreateMediaItemInput: CreateMediaItemInput;
  CreateRouteInlineInput: CreateRouteInlineInput;
  CreateRouteInput: CreateRouteInput;
  CreateStaticMediaFaceInlineInput: CreateStaticMediaFaceInlineInput;
  CreateStaticMediaFaceInput: CreateStaticMediaFaceInput;
  CreateWorkspaceInput: CreateWorkspaceInput;
  DateTime: Scalars['DateTime']['output'];
  Float: Scalars['Float']['output'];
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  MediaItem: MediaItem;
  Mutation: {};
  Query: {};
  Route: Route;
  StaticMediaFace: StaticMediaFace;
  String: Scalars['String']['output'];
  UpdateMediaItemInput: UpdateMediaItemInput;
  UpdateRouteInput: UpdateRouteInput;
  UpdateStaticMediaFaceInput: UpdateStaticMediaFaceInput;
  UpdateWorkspaceInput: UpdateWorkspaceInput;
  Workspace: Workspace;
};

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export type MediaItemResolvers<ContextType = any, ParentType extends ResolversParentTypes['MediaItem'] = ResolversParentTypes['MediaItem']> = {
  availability?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  closestLandmark?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  displayId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  format?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  latitude?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  location?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  longitude?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  routes?: Resolver<Maybe<Array<ResolversTypes['Route']>>, ParentType, ContextType>;
  staticMediaFaces?: Resolver<Maybe<Array<ResolversTypes['StaticMediaFace']>>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['MediaType'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  workspace?: Resolver<ResolversTypes['Workspace'], ParentType, ContextType>;
  workspaceId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  _empty?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createMediaItem?: Resolver<ResolversTypes['MediaItem'], ParentType, ContextType, RequireFields<MutationCreateMediaItemArgs, 'input'>>;
  createRoute?: Resolver<ResolversTypes['Route'], ParentType, ContextType, RequireFields<MutationCreateRouteArgs, 'input'>>;
  createStaticMediaFace?: Resolver<ResolversTypes['StaticMediaFace'], ParentType, ContextType, RequireFields<MutationCreateStaticMediaFaceArgs, 'input'>>;
  createWorkspace?: Resolver<ResolversTypes['Workspace'], ParentType, ContextType, RequireFields<MutationCreateWorkspaceArgs, 'input'>>;
  deleteMediaItem?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteMediaItemArgs, 'id'>>;
  deleteRoute?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteRouteArgs, 'id'>>;
  deleteStaticMediaFace?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteStaticMediaFaceArgs, 'id'>>;
  deleteWorkspace?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteWorkspaceArgs, 'id'>>;
  updateMediaItem?: Resolver<ResolversTypes['MediaItem'], ParentType, ContextType, RequireFields<MutationUpdateMediaItemArgs, 'id' | 'input'>>;
  updateRoute?: Resolver<ResolversTypes['Route'], ParentType, ContextType, RequireFields<MutationUpdateRouteArgs, 'id' | 'input'>>;
  updateStaticMediaFace?: Resolver<ResolversTypes['StaticMediaFace'], ParentType, ContextType, RequireFields<MutationUpdateStaticMediaFaceArgs, 'id' | 'input'>>;
  updateWorkspace?: Resolver<ResolversTypes['Workspace'], ParentType, ContextType, RequireFields<MutationUpdateWorkspaceArgs, 'id' | 'input'>>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  _empty?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  mediaItem?: Resolver<Maybe<ResolversTypes['MediaItem']>, ParentType, ContextType, RequireFields<QueryMediaItemArgs, 'id'>>;
  mediaItems?: Resolver<Array<ResolversTypes['MediaItem']>, ParentType, ContextType, RequireFields<QueryMediaItemsArgs, 'workspaceId'>>;
  routes?: Resolver<Array<ResolversTypes['Route']>, ParentType, ContextType, RequireFields<QueryRoutesArgs, 'mediaItemId'>>;
  staticMediaFaces?: Resolver<Array<ResolversTypes['StaticMediaFace']>, ParentType, ContextType, RequireFields<QueryStaticMediaFacesArgs, 'mediaItemId'>>;
  workspace?: Resolver<Maybe<ResolversTypes['Workspace']>, ParentType, ContextType, RequireFields<QueryWorkspaceArgs, 'id'>>;
  workspaces?: Resolver<Array<ResolversTypes['Workspace']>, ParentType, ContextType>;
};

export type RouteResolvers<ContextType = any, ParentType extends ResolversParentTypes['Route'] = ResolversParentTypes['Route']> = {
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  images?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  mediaItem?: Resolver<ResolversTypes['MediaItem'], ParentType, ContextType>;
  mediaItemId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  numberOfStreetPoles?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  pricePerStreetPole?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  routeName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sideRoute?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type StaticMediaFaceResolvers<ContextType = any, ParentType extends ResolversParentTypes['StaticMediaFace'] = ResolversParentTypes['StaticMediaFace']> = {
  availability?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  faceNumber?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  images?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  mediaItem?: Resolver<ResolversTypes['MediaItem'], ParentType, ContextType>;
  mediaItemId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  rent?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspaceResolvers<ContextType = any, ParentType extends ResolversParentTypes['Workspace'] = ResolversParentTypes['Workspace']> = {
  address?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  location?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  mediaItems?: Resolver<Array<ResolversTypes['MediaItem']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  DateTime?: GraphQLScalarType;
  MediaItem?: MediaItemResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Route?: RouteResolvers<ContextType>;
  StaticMediaFace?: StaticMediaFaceResolvers<ContextType>;
  Workspace?: WorkspaceResolvers<ContextType>;
};

