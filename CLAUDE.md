# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a **Next.js full-stack monorepo** using Turbo for build orchestration. The architecture separates frontend and backend concerns while sharing common packages:

- **Frontend**: Next.js 15 app at `apps/web` (typically port 3001)
- **Backend**: Express.js API at `apps/api` (port 3002)
- **Database**: SQL Server with Prisma ORM at `packages/database`
- **Shared Types**: TypeScript interfaces at `packages/types`
- **UI Components**: React components at `packages/ui`

## Key Development Commands

### Project Setup
```bash
npm install                           # Install all workspace dependencies
cp .env.example .env                 # Copy root environment variables
cp apps/web/.env.local.example apps/web/.env.local    # Frontend env
cp apps/api/.env.example apps/api/.env               # Backend env
```

### Database Operations
```bash
cd packages/database
npx prisma generate                  # Generate Prisma client after schema changes
npx prisma migrate dev               # Create and apply new migration
npx prisma db push                   # Push schema changes without migration
npx prisma studio                    # Open database GUI
```

### Development Workflow
```bash
npm run dev                          # Start all services (frontend + backend)
cd apps/web && npm run dev          # Frontend only (port 3001)
cd apps/api && npm run dev          # Backend only (port 3002) 
```

### Building and Type Checking
```bash
npm run build                        # Build all apps
npm run type-check                   # Type check all packages
npm run lint                         # Lint all packages
```

## Database Schema Architecture

The Prisma schema defines three core entities with clear relationships:

- **User**: Central entity with authentication fields (`email`, `password`) and timestamps
- **Project**: Belongs to User, has unique `apiKey` for API access
- **Event**: Analytics events belonging to both User and Project, with flexible `properties` JSON field

Key patterns:
- All IDs use CUID for better distributed system compatibility
- Cascade deletes maintain referential integrity
- JSON properties field allows flexible event tracking

## API Architecture and Authentication

### Authentication Flow
- JWT access tokens (15min expiry stored in localStorage)
- Refresh tokens (7 days expiry) for automatic token renewal
- Bearer authentication for protected endpoints
- Automatic token refresh in frontend API client with redirect on failure

### API Structure
- **Base URL**: `http://localhost:3002/api`
- **Health Check**: `/health`
- **Swagger Documentation**: `/api-docs` (simple implementation, not auto-generated)
- **Auth Routes**: `/api/auth/*` (register, login, refresh, logout)
- **Analytics Routes**: `/api/analytics/*` (dashboard, events, reports) - all require authentication

### API Client Pattern
Frontend uses centralized API client (`apps/web/src/lib/api.ts`) with:
- Axios interceptors for automatic token attachment
- Request/response type safety using shared types
- Automatic retry with token refresh on 401 errors

## Workspace and Package Management

### TypeScript Configuration
- Shared types in `@product-analytics/types` package
- Path aliases configured: `@/*` for src directories
- Strict TypeScript config across all packages

### Environment Variables
- Separate `.env` files for each app with examples provided
- Backend requires: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`
- Frontend requires: `NEXT_PUBLIC_API_URL`

### Monorepo Structure
- Turbo manages task execution and caching
- Workspaces configuration allows shared dependencies
- Each package has independent versioning and scripts

## Development Patterns

### Error Handling
- Centralized error middleware in backend (`middleware/errorHandler.ts`)
- Custom `AppError` interface with operational error flags
- Frontend API client handles errors with user-friendly messages

### Code Organization
- Controllers handle HTTP request/response logic
- Services contain business logic (not yet implemented)
- Middleware for cross-cutting concerns (auth, error handling, logging)
- Shared validation logic should use Zod schemas

### Testing Strategy
Run type checking before committing changes:
```bash
npm run type-check
```

Database changes require migration generation:
```bash
cd packages/database && npx prisma migrate dev --name describe_your_changes
```

## API Documentation

Swagger UI provides interactive API documentation at `http://localhost:3002/api-docs`. The current implementation uses a simple static schema definition rather than auto-generated docs from JSDoc comments. When adding new endpoints, update the schema in `apps/api/src/swagger-simple.ts`.