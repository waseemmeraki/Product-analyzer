# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a **Product Analysis Platform** built as a Next.js full-stack monorepo using Turbo for build orchestration. The application allows users to scrape product data from Ulta Beauty, analyze trends, and generate insights using AI.

- **Frontend**: Next.js 15 app at `apps/web` (port 3001) - Product selection, analysis visualization, and PDF export
- **Backend**: Express.js API at `apps/api` (port 3002) - Scraping, analysis, and data management
- **Database**: MySQL with Sequelize ORM at `packages/database`
- **Shared Types**: TypeScript interfaces at `packages/types`
- **UI Components**: React components at `packages/ui` (Shadcn UI based)

## Key Development Commands

### Project Setup
```bash
npm install                           # Install all workspace dependencies
cp .env.example .env                 # Copy root environment variables
cp apps/web/.env.local.example apps/web/.env.local    # Frontend env
cp apps/api/.env.example apps/api/.env               # Backend env
```

### Database Operations (Sequelize)
```bash
cd packages/database
npm run db:create                    # Create database
npm run db:migrate                   # Run migrations
npm run db:migrate:undo              # Undo last migration
npm run db:seed                      # Seed database
npm run migration:create -- --name migration-name  # Create new migration
npm run db:test                      # Test database connection
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

The application uses MySQL with Sequelize ORM. The main entity is:

- **Product**: Stores scraped product data from Ulta Beauty
  - `Id`: UUID primary key
  - `Name`: Product name
  - `Brand`: Product brand (currently "Ulta")
  - `Category`: Product category (e.g., "Shampoo", "Moisturizers")
  - `Ingredients`: Full ingredient list as text
  - `IngredientCategories`: AI-generated categories for ingredients
  - `Claims`: Product claims/benefits as text
  - `Rating`: Product rating (0-5)
  - `ReviewCount`: Number of reviews

The schema also includes migrations for Users, Projects, and Events (from template) but these are not currently used in the application.

## API Architecture

### Core Features
- **Web Scraping**: Automated product data extraction from Ulta Beauty
- **AI Analysis**: OpenAI-powered trend analysis and insights generation
- **PDF Export**: Generate professional analysis reports
- **Caching**: Analysis results cached for 15 minutes to reduce API costs

### API Structure
- **Base URL**: `http://localhost:3002/api`
- **Health Check**: `/health`
- **Swagger Documentation**: `/api-docs` (interactive API documentation)
- **Product Routes**: `/api/products/*` - Get brands, categories, and products
- **Scraper Routes**: `/api/scraper/*` - Scrape Ulta products and save to database
- **Analysis Routes**: `/api/analysis/*` - Analyze products and export reports
- **Auth Routes**: `/api/auth/*` (template routes - not currently used)
- **Analytics Routes**: `/api/analytics/*` (template routes - not currently used)

### Key API Endpoints

#### Products API
- `GET /api/products/brands/:brand/categories` - Get categories for a brand
- `GET /api/products/brands/:brand/categories/:category/products` - Get products by category

#### Scraper API
- `POST /api/scraper/ulta` - Scrape products from Ulta URL (returns data only)
- `POST /api/scraper/ulta/save` - Scrape and save products to database

#### Analysis API
- `POST /api/analysis` - Analyze selected products with OpenAI
- `GET /api/analysis/health` - Check analysis service health and cache stats
- `GET /api/analysis/cache` - View or manage analysis cache
- `POST /api/analysis/export/pdf` - Export analysis report as PDF

## Workspace and Package Management

### TypeScript Configuration
- Shared types in `@product-analytics/types` package
- Path aliases configured: `@/*` for src directories
- Strict TypeScript config across all packages

### Environment Variables
- Separate `.env` files for each app with examples provided
- Backend requires: 
  - `DATABASE_URL` (MySQL connection string)
  - `OPENAI_API_KEY` (for AI analysis)
  - `JWT_SECRET`, `JWT_REFRESH_SECRET` (for auth - not currently used)
- Frontend requires: 
  - `NEXT_PUBLIC_API_URL` (backend API URL)

### Monorepo Structure
- Turbo manages task execution and caching
- Workspaces configuration allows shared dependencies
- Each package has independent versioning and scripts

## Development Patterns

### Application Flow
1. **Data Collection**: Users enter Ulta product URLs to scrape product data
2. **Product Selection**: Browse categories and select products for analysis
3. **AI Analysis**: Selected products are analyzed for trends using OpenAI GPT-4O with comprehensive insights
4. **Interactive Analysis**: View detailed analysis with:
   - **Trending/Emerging/Declining tabs** with rich descriptions and embedded links
   - **Comprehensive Insights tab** with usage metrics, credibility scores, and web references
   - **Cross-analysis patterns** showing relationships between different trend categories
5. **Report Generation**: Export complete analysis as professional PDF reports

### Key Services

#### Web Scraper Service (`webScraperService.ts`)
- Uses Playwright for browser automation
- Extracts product details, ingredients, claims, ratings
- Handles pagination and rate limiting
- Automatically categorizes ingredients using AI

#### OpenAI Service (`openai.ts`)
- **GPT-4O Integration**: Uses OpenAI GPT-4O model for comprehensive product analysis
- **Dynamic Analysis**: Real-time analysis of trending/emerging/declining patterns based on actual product data
- **Rich Insights Generation**: Creates detailed insights with usage metrics, credibility scores, and supporting facts
- **Comprehensive Descriptions**: Generates detailed descriptions for ingredients, claims, and categories with embedded links
- **Consistent Results**: Uses deterministic seeds and temperature=0.0 for reproducible analysis
- **Cross-Category Support**: Adapts analysis approach to any Ulta product category (beauty, hair, wellness, tools, etc.)
- **Scientific Backing**: Includes references to credible sources and educational links

#### Analysis Cache Service (`analysisCache.ts`)
- **15-minute Caching**: Stores analysis results to reduce OpenAI API costs
- **Cache Management**: Health monitoring and manual cache clearing capabilities
- **Performance Optimization**: Significantly reduces response times for repeated analyses

#### PDF Generator Service (`pdfGenerator.ts`)
- **Professional Reports**: Creates comprehensive, print-ready analysis reports
- **Complete Content**: Includes ALL analysis data - descriptions, insights, metrics, and web references
- **Rich Formatting**: Professional styling with charts, metrics grids, and proper typography
- **Interactive Elements**: Clickable links to supporting sources and references
- **Optimized Layout**: Compact first-page design with efficient space utilization
- **Visual Analytics**: Includes doughnut charts for data overview and trend visualization

### Error Handling
- Centralized error middleware in backend
- Graceful handling of scraping failures
- API rate limiting and retry logic
- User-friendly error messages in UI

## Usage Workflow

1. **Scrape Products**:
   - Enter an Ulta category URL (e.g., `https://www.ulta.com/shop/hair/shampoo`)
   - Specify number of products to scrape (1-50)
   - Click "Scrap" to fetch and save products

2. **Select Products**:
   - Choose a category from the dropdown
   - Select products for analysis (checkbox selection)
   - Click "Analyze" to generate insights

3. **View Analysis**:
   - **Browse Trending/Emerging/Declining tabs** with detailed descriptions and scientific explanations
   - **Explore Comprehensive Insights** with usage metrics, market penetration data, and credibility scores
   - **Access Web References** with validated URLs providing proof and supporting evidence
   - **Review Cross-Category Analysis** showing patterns across all analyzed products
   - **Export Professional PDF Reports** containing complete analysis with interactive links

## Advanced Analysis Features

### AI-Powered Insights System
The application now features a sophisticated analysis system that provides:

#### Comprehensive Trend Analysis
- **Trending Items**: High-performing ingredients, claims, and categories with strong consumer satisfaction (≥4.0 stars, 40%+ presence)
- **Emerging Items**: Innovative elements showing growth potential (15-40% presence, representing new science/demands)
- **Declining Items**: Elements losing favor (in low-rated products <3.5 stars, outdated formulations)

#### Rich Content Generation
- **Detailed Descriptions**: Each section includes scientific explanations with embedded educational links
- **Usage Statistics**: Exact percentages, ratings, and frequency data from analyzed products
- **Market Context**: Category-specific benefits, consumer trends, and formulation science

#### Advanced Insights Dashboard
- **Cross-Category Analysis**: Insights that analyze ALL trending, emerging, and declining items collectively
- **Usage Metrics**: Search volume, trending scores, user engagement, recent mentions, and market penetration
- **Credibility Scoring**: 1-100 scale based on scientific evidence, market presence, safety profile, and regulatory status
- **Web References**: Automatically sourced and validated URLs from credible sources providing supporting evidence

#### Data Consistency & Reliability
- **Deterministic Analysis**: Uses consistent product ordering and deterministic seeds for reproducible results
- **Temperature=0.0**: Ensures maximum consistency in OpenAI responses
- **Comprehensive Validation**: All analysis based strictly on actual product data with no external assumptions

### PDF Export System
- **Complete Content Export**: All descriptions, insights, metrics, and references included
- **Professional Formatting**: Clean, print-ready layout with charts and visual analytics
- **Interactive Elements**: Clickable links to supporting sources preserved in PDF
- **Optimized Layout**: Compact design maximizing first-page content utilization

## API Documentation

Swagger UI provides interactive API documentation at `http://localhost:3002/api-docs`. The implementation uses a simple schema definition in `apps/api/src/swagger-simple.ts`.

## Recent Enhancements (Latest Updates)

### OpenAI Integration Improvements
- **GPT-4O Model**: Upgraded to latest OpenAI model for enhanced analysis quality
- **Dynamic Prompting**: Adaptive prompts that adjust to any Ulta product category
- **URL Validation System**: Automatic sourcing and validation of supporting web references
- **Comprehensive System Prompts**: Detailed instructions ensuring consistent, high-quality analysis

### Frontend Analysis Interface
- **Enhanced Insights Tab**: Complete redesign with usage metrics, credibility scores, and web references
- **Rich Descriptions**: All trending/emerging/declining sections now include detailed explanations with links
- **Cross-Analysis Patterns**: Insights show relationships and patterns across all trend categories
- **Professional UI**: Consistent styling with proper spacing, colors, and typography

### PDF Generation Enhancements
- **Complete Content Inclusion**: All frontend analysis data now included in PDF exports
- **Enhanced Formatting**: Professional styling with metrics grids, charts, and proper typography
- **Space Optimization**: Eliminated excessive whitespace for efficient page utilization
- **Interactive Links**: Preserved clickable URLs and references in exported PDFs