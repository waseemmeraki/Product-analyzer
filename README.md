# Product Analytics AI

A scalable full-stack Next.js application for product analytics with separate frontend and backend APIs.

## Architecture

This project uses a monorepo structure with the following components:

- **apps/web** - Next.js frontend application
- **apps/api** - Express.js backend API
- **packages/database** - Prisma database schema and client
- **packages/types** - Shared TypeScript types
- **packages/ui** - Shared UI components
- **libs/auth** - Authentication utilities
- **libs/validation** - Schema validation

## Getting Started

### Prerequisites

- Node.js 18+
- SQL Server database
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   cp apps/web/.env.local.example apps/web/.env.local
   cp apps/api/.env.example apps/api/.env
   ```

4. Set up the database:
   ```bash
   cd packages/database
   npx prisma migrate dev
   ```

### Development

Run all applications in development mode:
```bash
npm run dev
```

Or run individually:
```bash
# Frontend (port 3000)
cd apps/web && npm run dev

# Backend API (port 3001)
cd apps/api && npm run dev
```

### Database Operations

```bash
# Generate Prisma client
cd packages/database && npx prisma generate

# Run migrations
cd packages/database && npx prisma migrate dev

# Open Prisma Studio
cd packages/database && npx prisma studio
```

## Project Structure

```
product-analytics-ai/
├── apps/
│   ├── web/                 # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/         # App router pages
│   │   │   ├── components/  # React components
│   │   │   └── lib/         # Utilities & API client
│   │   └── package.json
│   └── api/                 # Express.js backend
│       ├── src/
│       │   ├── controllers/ # Route controllers
│       │   ├── middleware/  # Express middleware
│       │   ├── routes/      # API routes
│       │   └── services/    # Business logic
│       └── package.json
├── packages/
│   ├── database/            # Prisma setup
│   │   ├── prisma/         # Schema & migrations
│   │   └── src/            # Database client
│   ├── types/              # Shared TypeScript types
│   └── ui/                 # Shared UI components
└── package.json            # Root package.json with workspaces
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard data
- `POST /api/analytics/events` - Track events
- `GET /api/analytics/reports/:type` - Generate reports

## Technologies Used

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Express.js, TypeScript
- **Database**: SQL Server with Prisma ORM
- **Build Tool**: Turbo (monorepo management)
- **Authentication**: JWT tokens
- **Validation**: Zod schemas