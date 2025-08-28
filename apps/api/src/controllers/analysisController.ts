import { Request, Response } from 'express';
import { z } from 'zod';
import { DatabaseService } from '../services/database';
import { OpenAIService } from '../services/openai';
import { PDFGeneratorService } from '../services/pdfGenerator';

const analysisRequestSchema = z.object({
  productIds: z.array(z.string().uuid('Invalid product ID format')).min(1, 'At least one product ID is required'),
});

class AnalysisController {
  private databaseService: DatabaseService;
  private openaiService: OpenAIService;
  private pdfGeneratorService: PDFGeneratorService;

  constructor() {
    this.databaseService = new DatabaseService();
    this.openaiService = new OpenAIService();
    this.pdfGeneratorService = new PDFGeneratorService();
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
      console.log('Calling OpenAI service with products:', products.map(p => ({id: p.Id, name: p.Name})));
      const analysis = await this.openaiService.analyzeProducts(products);

      // Set no-cache headers to prevent caching
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      // Return analysis results
      res.json({
        success: true,
        data: {
          productsAnalyzed: products.length,
          productsRequested: productIds.length,
          analysis: {
            trending: {
              ingredients: analysis.trending.ingredients,
              ingredientsDescription: analysis.trending.ingredientsDescription,
              claims: analysis.trending.claims,
              claimsDescription: analysis.trending.claimsDescription,
              ingredientCategories: analysis.trending.ingredientCategories,
              ingredientCategoriesDescription: analysis.trending.ingredientCategoriesDescription
            },
            emerging: {
              ingredients: analysis.emerging.ingredients,
              ingredientsDescription: analysis.emerging.ingredientsDescription,
              claims: analysis.emerging.claims,
              claimsDescription: analysis.emerging.claimsDescription,
              ingredientCategories: analysis.emerging.ingredientCategories,
              ingredientCategoriesDescription: analysis.emerging.ingredientCategoriesDescription
            },
            declining: {
              ingredients: analysis.declining.ingredients,
              ingredientsDescription: analysis.declining.ingredientsDescription,
              claims: analysis.declining.claims,
              claimsDescription: analysis.declining.claimsDescription,
              ingredientCategories: analysis.declining.ingredientCategories,
              ingredientCategoriesDescription: analysis.declining.ingredientCategoriesDescription
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
      await this.databaseService.testConnection();
      
      // Test OpenAI API key presence
      const openaiConfigured = !!process.env.OPENAI_API_KEY;

      res.json({
        status: 'OK',
        services: {
          database: 'connected',
          openai: openaiConfigured ? 'configured' : 'not configured'
        },
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


  // PDF export endpoint
  exportToPDF = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body - reuse the same schema but for PDF export
      const validationResult = analysisRequestSchema.safeParse(req.body);
      
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
      const { selectedCategory } = req.body; // Additional field for PDF context

      // Fetch products from database
      const products = await this.databaseService.getProductsByIds(productIds);

      if (products.length === 0) {
        res.status(404).json({
          error: 'No products found',
          message: 'None of the provided product IDs match existing products'
        });
        return;
      }

      // Analyze products with OpenAI
      const analysis = await this.openaiService.analyzeProducts(products);

      // Generate PDF
      const reportData = {
        analysis: {
          trending: {
            ingredients: analysis.trending.ingredients,
            ingredientsDescription: analysis.trending.ingredientsDescription,
            claims: analysis.trending.claims,
            claimsDescription: analysis.trending.claimsDescription,
            ingredientCategories: analysis.trending.ingredientCategories,
            ingredientCategoriesDescription: analysis.trending.ingredientCategoriesDescription
          },
          emerging: {
            ingredients: analysis.emerging.ingredients,
            ingredientsDescription: analysis.emerging.ingredientsDescription,
            claims: analysis.emerging.claims,
            claimsDescription: analysis.emerging.claimsDescription,
            ingredientCategories: analysis.emerging.ingredientCategories,
            ingredientCategoriesDescription: analysis.emerging.ingredientCategoriesDescription
          },
          declining: {
            ingredients: analysis.declining.ingredients,
            ingredientsDescription: analysis.declining.ingredientsDescription,
            claims: analysis.declining.claims,
            claimsDescription: analysis.declining.claimsDescription,
            ingredientCategories: analysis.declining.ingredientCategories,
            ingredientCategoriesDescription: analysis.declining.ingredientCategoriesDescription
          },
          insights: analysis.insights
        },
        selectedCategory: selectedCategory || 'Unknown Category',
        productsAnalyzed: products.length,
        generationDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      };

      const pdfBuffer = await this.pdfGeneratorService.generatePDF(reportData);

      // Set response headers for PDF download with no-cache
      const filename = `Analysis_Report_${selectedCategory?.replace(/[^a-zA-Z0-9]/g, '_') || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // Send PDF buffer
      res.send(pdfBuffer);

    } catch (error) {
      console.error('Error generating PDF report:', error);
      
      if (error instanceof Error) {
        res.status(500).json({
          error: 'PDF generation failed',
          message: error.message
        });
      } else {
        res.status(500).json({
          error: 'Internal server error',
          message: 'An unexpected error occurred during PDF generation'
        });
      }
    }
  };
}

export { AnalysisController };