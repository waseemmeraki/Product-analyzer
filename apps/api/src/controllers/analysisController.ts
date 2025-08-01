import { Request, Response } from 'express';
import { z } from 'zod';
import { DatabaseService } from '../services/database';
import { OpenAIService } from '../services/openai';

const analysisRequestSchema = z.object({
  productIds: z.array(z.string().uuid('Invalid product ID format')).min(1, 'At least one product ID is required'),
});

class AnalysisController {
  private databaseService: DatabaseService;
  private openaiService: OpenAIService;

  constructor() {
    this.databaseService = new DatabaseService();
    this.openaiService = new OpenAIService();
  }

  analyzeProducts = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body
      const validationResult = analysisRequestSchema.safeParse(req.body);
      debugger;
      if (!validationResult.success) {
        res.status(400).json({
          error: 'Invalid request',
          details: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
        return;
      }

      const { productIds } = validationResult.data;

      // Fetch products from database
      const products = await this.databaseService.getProductsByIds(productIds);

      if (products.length === 0) {
        res.status(404).json({
          error: 'No products found',
          message: 'None of the provided product IDs match existing products'
        });
        return;
      }

      // Log found vs requested products
      console.log(`Analyzing ${products.length} products out of ${productIds.length} requested`);

      // Analyze products with OpenAI
      const analysis = await this.openaiService.analyzeProducts(products);

      // Return analysis results
      res.json({
        success: true,
        data: {
          productsAnalyzed: products.length,
          productsRequested: productIds.length,
          analysis: {
            trending: {
              ingredients: analysis.trending.ingredients,
              claims: analysis.trending.claims,
              ingredientCategories: analysis.trending.ingredientCategories
            },
            emerging: {
              ingredients: analysis.emerging.ingredients,
              claims: analysis.emerging.claims,
              ingredientCategories: analysis.emerging.ingredientCategories
            },
            declining: {
              ingredients: analysis.declining.ingredients,
              claims: analysis.declining.claims,
              ingredientCategories: analysis.declining.ingredientCategories
            },
            insights: analysis.insights
          }
        }
      });

    } catch (error) {
      console.error('Error in product analysis:', error);
      
      if (error instanceof Error) {
        res.status(500).json({
          error: 'Analysis failed',
          message: error.message
        });
      } else {
        res.status(500).json({
          error: 'Internal server error',
          message: 'An unexpected error occurred during analysis'
        });
      }
    }
  };

  // Health check for analysis service
  healthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      // Test database connection
      const dbTest = await this.databaseService.connect();
      
      // Test OpenAI API key presence
      const openaiConfigured = !!process.env.OPENAI_API_KEY;

      // Get cache statistics
      const cacheStats = this.openaiService.getCacheStats();

      res.json({
        status: 'OK',
        services: {
          database: 'connected',
          openai: openaiConfigured ? 'configured' : 'not configured'
        },
        cache: cacheStats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  };

  // Cache management endpoint
  manageCacheStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const action = req.query.action as string;
      
      if (action === 'clear') {
        this.openaiService.clearCache();
        res.json({
          success: true,
          message: 'Analysis cache cleared successfully',
          timestamp: new Date().toISOString()
        });
      } else if (action === 'cleanup') {
        this.openaiService.cleanupExpiredEntries();
        const stats = this.openaiService.getCacheStats();
        res.json({
          success: true,
          message: 'Expired cache entries cleaned up',
          cache: stats,
          timestamp: new Date().toISOString()
        });
      } else {
        // Default: return cache statistics
        const stats = this.openaiService.getCacheStats();
        res.json({
          success: true,
          cache: stats,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  };
}

export { AnalysisController };