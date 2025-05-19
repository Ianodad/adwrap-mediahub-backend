# ADWrap Media Hub Backend

A GraphQL API server for managing outdoor advertising media inventory, built with Node.js, Express, Apollo Server, and Prisma ORM.

## Technologies Used

- **Node.js**: JavaScript runtime environment
- **Express**: Web application framework
- **Apollo Server**: GraphQL server
- **Prisma ORM**: Database toolkit
- **PostgreSQL**: Relational database
- **TypeScript**: Typed JavaScript
- **Winston**: Structured logging

## Features

- Workspaces management
- Media items management (Billboards and Street Poles)
- Static media faces for billboards (multiple faces per billboard)
- Routes for street poles (multiple routes per street pole)
- Advanced error handling and logging
- Data validation and error reporting

## Project Structure

```
adwrap-mediahub-backend/
├── prisma/                   # Prisma schema and migrations
|   ├── schema.prisma         # Database schema definition
|   └── seed.ts               # Seed script for sample data
├── src/
|   ├── config/               # Configuration files
|   ├── graphql/              # GraphQL schemas and resolvers
|   |   ├── resolvers/        # GraphQL resolvers
|   |   └── schemas/          # GraphQL type definitions
|   ├── middleware/           # Express middleware
|   |   └── errorHandler.ts   # Global error handling
|   ├── models/               # Data models and business logic
|   ├── seed/                 # Seed data for development
|   ├── utils/                # Utility functions
|   |   ├── idGenerator.ts    # ID generation for media items
|   |   ├── logger.ts         # Logging configuration
|   |   └── prismaErrorHandler.ts # Prisma-specific error handling
|   └── index.ts              # Application entry point
├── tests/                    # Unit and integration tests
├── Dockerfile                # Docker configuration
└── package.json              # NPM dependencies and scripts
```

## Data Models

### Workspaces
- Represents advertising agencies or clients
- Contains multiple media items

### Media Items
- Two types: Billboards and Street Poles
- Each linked to a workspace
- Contains location and availability information

### Static Media Faces
- Represents individual faces of billboards
- Each billboard can have multiple faces
- Includes information on orientation, rent, and availability

### Routes
- Represents street pole routes
- Contains information on number of poles and pricing

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- PostgreSQL database

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ianodad/adwrap-assessment-backend.git
   cd adwrap-assessment-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env` file in the project root with the following:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/adwrap_mediahub"
   PORT=9001
   NODE_ENV=development
   ```

4. Set up the database:
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate dev
   
   # Seed the database with sample data
   npm run seed
   ```

5. Start the server:
   ```bash
   npm run dev
   ```

6. The GraphQL playground will be available at: http://localhost:9001/graphql

## API Documentation

The API is built with GraphQL, providing the following operations:

### Queries

- **workspaces**: Get all workspaces
- **workspace(id)**: Get a specific workspace by ID
- **mediaItems(workspaceId)**: Get all media items for a workspace
- **mediaItem(id)**: Get a specific media item by ID
- **staticMediaFaces(mediaItemId)**: Get all static media faces for a media item
- **routes(mediaItemId)**: Get all routes for a media item

### Mutations

- **createWorkspace**: Create a new workspace
- **updateWorkspace**: Update an existing workspace
- **deleteWorkspace**: Delete a workspace

- **createMediaItem**: Create a new media item (billboard or street pole)
- **updateMediaItem**: Update an existing media item
- **deleteMediaItem**: Delete a media item

- **createStaticMediaFace**: Create a new static media face for a billboard
- **updateStaticMediaFace**: Update an existing static media face
- **deleteStaticMediaFace**: Delete a static media face

- **createRoute**: Create a new route for a street pole
- **updateRoute**: Update an existing route
- **deleteRoute**: Delete a route

## Sample GraphQL Queries

### Get All Workspaces
```graphql
query {
  workspaces {
    id
    name
    email
    address
    location
  }
}
```

### Get Media Items for a Workspace
```graphql
query GetMediaItems($workspaceId: Int!) {
  mediaItems(workspaceId: $workspaceId) {
    id
    displayId
    name
    type
    format
    location
    availability
  }
}
```

### Create a Billboard
```graphql
mutation CreateBillboard($input: CreateMediaItemInput!) {
  createMediaItem(input: $input) {
    id
    displayId
    name
    type
    format
    location
  }
}

# Variables
{
  "input": {
    "workspaceId": 1,
    "type": "BILLBOARD",
    "name": "Downtown Billboard",
    "format": "standard",
    "location": "Main Street",
    "availability": "Available"
  }
}
```

## Error Handling

The API includes robust error handling that provides clear and concise error messages. Errors are categorized as:

- **Bad Request (400)**: Invalid input data
- **Not Found (404)**: Resource not found
- **Internal Server Error (500)**: Unexpected server errors

## Development

### Scripts

- `npm run dev`: Start the development server with hot-reload
- `npm run build`: Build the project
- `npm start`: Start the production server
- `npm run seed`: Seed the database with sample data
- `npm test`: Run tests
- `npm run prisma:generate`: Generate Prisma client
- `npm run prisma:migrate`: Run database migrations

### Docker Deployment

```bash
# Build Docker Image
docker build -t adwrap-mediahub-backend .

# Run Docker Container
docker run -p 9001:9001 -e DATABASE_URL=postgresql://username:password@host.docker.internal:5432/adwrap_mediahub adwrap-mediahub-backend
```

## Authentication

This assessment version does not include authentication. In a real-world application, authentication would be implemented using JWT or a similar solution.

## License

[MIT License](LICENSE)