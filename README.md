# Product Analyzer

An AI-powered product analysis platform that scrapes cosmetic and skincare products from Ulta Beauty, analyzes trends, and generates professional insights reports.

## Features

- **Web Scraping**: Automated extraction of product data from Ulta Beauty
- **AI-Powered Analysis**: Uses OpenAI GPT-4 to identify trending, emerging, and declining ingredients/claims
- **Interactive Dashboard**: Browse products by category and select for analysis
- **Detailed Insights**: Get comprehensive insights with supporting scientific studies
- **PDF Export**: Generate professional analysis reports for sharing
- **Smart Caching**: Analysis results cached to optimize API usage

## Architecture

This is a full-stack Next.js monorepo application with:

- **Frontend** (`apps/web`): Next.js 15 app with React and Tailwind CSS
- **Backend** (`apps/api`): Express.js API server with TypeScript
- **Database** (`packages/database`): MySQL with Sequelize ORM
- **Shared Types** (`packages/types`): TypeScript interfaces shared across apps
- **UI Components** (`packages/ui`): Reusable React components

## Prerequisites

- Node.js 18+
- MySQL database
- OpenAI API key
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd product-analyzer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create `.env` files in the appropriate directories:
   
   ```bash
   # Backend environment (apps/api/.env)
   DATABASE_URL="mysql://username:password@localhost:3306/product_analyzer"
   PORT=3002
   NODE_ENV=development
   OPENAI_API_KEY="your-openai-api-key"
   JWT_SECRET="your-jwt-secret"
   JWT_REFRESH_SECRET="your-jwt-refresh-secret"
   ```
   
   ```bash
   # Frontend environment (apps/web/.env.local)
   NEXT_PUBLIC_API_URL="http://localhost:3002"
   ```

4. **Set up the database**
   ```bash
   # Create database
   cd packages/database
   npm run db:create
   
   # Run migrations
   npm run db:migrate
   ```

## Development

Start the development servers:

```bash
# Start both frontend and backend
npm run dev

# Or run individually:
# Frontend (http://localhost:3001)
cd apps/web && npm run dev

# Backend API (http://localhost:3002)
cd apps/api && npm run dev
```

## Usage

1. **Access the Application**
   - Open http://localhost:3001 in your browser
   - You'll be redirected to the product selector page

2. **Scrape Products**
   - Enter a valid Ulta Beauty category URL (e.g., `https://www.ulta.com/shop/hair/shampoo`)
   - Specify the number of products to scrape (1-50)
   - Click "Scrap" to fetch and save products to the database

3. **Analyze Products**
   - Select a category from the dropdown
   - Choose products for analysis using checkboxes
   - Click "Analyze" to generate AI-powered insights

4. **View Results**
   - Browse trending, emerging, and declining ingredients/claims
   - Read detailed insights with scientific backing
   - Export the analysis as a PDF report

## API Documentation

Interactive API documentation is available at http://localhost:3002/api-docs when the backend is running.

### Key Endpoints

- `GET /api/products/brands/:brand/categories` - List product categories
- `GET /api/products/brands/:brand/categories/:category/products` - Get products by category
- `POST /api/scraper/ulta/save` - Scrape and save products from Ulta
- `POST /api/analysis` - Analyze selected products
- `POST /api/analysis/export/pdf` - Export analysis as PDF

## Project Structure

```
product-analyzer/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/            # Pages and layouts
│   │   │   ├── components/     # React components
│   │   │   └── lib/            # Utilities and API client
│   │   └── package.json
│   └── api/                    # Express.js backend
│       ├── src/
│       │   ├── controllers/    # Route handlers
│       │   ├── services/       # Business logic
│       │   ├── routes/         # API routes
│       │   └── middleware/     # Express middleware
│       └── package.json
├── packages/
│   ├── database/               # MySQL/Sequelize setup
│   │   ├── models/             # Database models
│   │   ├── migrations/         # Database migrations
│   │   └── src/                # Database connection
│   ├── types/                  # Shared TypeScript types
│   └── ui/                     # Shared UI components
└── package.json                # Root package.json
```

## Technologies Used

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Express.js, TypeScript, Sequelize ORM
- **Database**: MySQL
- **AI**: OpenAI GPT-4
- **Web Scraping**: Playwright
- **PDF Generation**: PDFKit
- **Build Tool**: Turbo (monorepo management)

## Scripts

### Root Level
- `npm run dev` - Start all services in development mode
- `npm run build` - Build all applications
- `npm run lint` - Lint all packages
- `npm run type-check` - Type check all packages

### Database Operations
```bash
cd packages/database
npm run db:migrate         # Run migrations
npm run db:migrate:undo    # Undo last migration
npm run migration:create -- --name <name>  # Create new migration
npm run db:test           # Test database connection
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.