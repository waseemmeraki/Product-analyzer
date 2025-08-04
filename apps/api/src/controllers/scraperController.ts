import { Request, Response } from 'express';
import { z } from 'zod';
import { WebScraperService } from '../services/webScraperService';

const scrapeRequestSchema = z.object({
  url: z.string().url('Invalid URL format'),
  selectors: z.record(z.array(z.string())).optional(),
  options: z.object({
    headless: z.boolean().optional(),
    timeout: z.number().min(5000).max(120000).optional(),
    maxRetries: z.number().min(1).max(5).optional(),
    proxy: z.string().optional()
  }).optional()
});

const scrapeSephoraSchema = z.object({
  categoryUrl: z.string().url('Invalid category URL format'),
  limit: z.number().min(1).max(100).optional().default(20),
  options: z.object({
    headless: z.boolean().optional(),
    timeout: z.number().min(5000).max(120000).optional(),
    maxRetries: z.number().min(1).max(5).optional(),
    proxy: z.string().optional()
  }).optional()
});

export class ScraperController {
  private scraperService: WebScraperService | null = null;

  private async getScraperService(options: any = {}): Promise<WebScraperService> {
    if (this.scraperService) {
      await this.scraperService.close();
    }
    
    this.scraperService = new WebScraperService(options);
    await this.scraperService.initialize();
    return this.scraperService;
  }

  scrapeWebsite = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    let scraperService: WebScraperService | null = null;

    try {
      const validationResult = scrapeRequestSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          details: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
        return;
      }

      const { url, selectors, options } = validationResult.data;

      // Default selectors if none provided
      const defaultSelectors = {
        titles: ['h1', 'h2', '.title', '[class*="title"]'],
        links: ['a[href]'],
        images: ['img[src]'],
        text: ['p', '.description', '[class*="description"]']
      };

      scraperService = await this.getScraperService(options);
      const result = await scraperService.scrapeWebsite(url, selectors || defaultSelectors);

      const duration = Date.now() - startTime;

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          debug: result.debug,
          meta: {
            url: result.url,
            duration,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
          debug: result.debug,
          meta: {
            duration,
            timestamp: new Date().toISOString()
          }
        });
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('Scraping error:', error);
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown scraping error',
        meta: {
          duration,
          timestamp: new Date().toISOString()
        }
      });
    } finally {
      if (scraperService) {
        await scraperService.close();
      }
    }
  };

  scrapeUltaProducts = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    let scraperService: WebScraperService | null = null;

    try {
      const validationResult = scrapeSephoraSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          details: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
        return;
      }

      const { categoryUrl, limit, options } = validationResult.data;

      scraperService = await this.getScraperService(options);
      const products = await scraperService.scrapeUltaProducts(categoryUrl, limit);

      const duration = Date.now() - startTime;

      res.json({
        success: true,
        data: products,
        meta: {
          categoryUrl,
          requestedLimit: limit,
          actualCount: products.length,
          duration,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('Ulta scraping error:', error);
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown scraping error',
        meta: {
          categoryUrl: req.body?.categoryUrl,
          duration,
          timestamp: new Date().toISOString()
        }
      });
    } finally {
      if (scraperService) {
        await scraperService.close();
      }
    }
  };

  scrapeSephoraProducts = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    let scraperService: WebScraperService | null = null;

    try {
      const validationResult = scrapeSephoraSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          details: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
        return;
      }

      const { categoryUrl, limit, options } = validationResult.data;

      scraperService = await this.getScraperService(options);
      const products = await scraperService.scrapeSephoraProducts(categoryUrl, limit);

      const duration = Date.now() - startTime;

      res.json({
        success: true,
        data: products,
        meta: {
          categoryUrl,
          requestedLimit: limit,
          actualCount: products.length,
          duration,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('Sephora scraping error:', error);
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown scraping error',
        meta: {
          categoryUrl: req.body?.categoryUrl,
          duration,
          timestamp: new Date().toISOString()
        }
      });
    } finally {
      if (scraperService) {
        await scraperService.close();
      }
    }
  };

  // Quick scrape endpoint for testing with query parameters
  quickScrape = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    let scraperService: WebScraperService | null = null;

    try {
      const { url, headless, timeout } = req.query;

      if (!url || typeof url !== 'string') {
        res.status(400).json({
          success: false,
          error: 'URL parameter is required'
        });
        return;
      }

      // Validate URL
      try {
        new URL(url);
      } catch {
        res.status(400).json({
          success: false,
          error: 'Invalid URL format'
        });
        return;
      }

      const options = {
        headless: headless !== 'false',
        timeout: timeout ? parseInt(timeout as string) : 60000
      };

      // Default selectors for quick testing
      const testSelectors = {
        productNames: [
          'body > div:nth-child(3) > div > div > div > div.css-1d7k5x6.e15t7owz0 > main > div:nth-child(4) > div.css-1efvm88 > div > div > a > div.ProductTile-content > span.css-qs99nc.e15t7owz0',
          '.ProductTile-content span',
          '[class*="ProductTile"] span',
          '[data-testid*="product-name"]'
        ],
        productLinks: [
          'a[href*="/product/"]',
          '[class*="ProductTile"] a',
          'a[data-testid*="product"]'
        ],
        titles: ['h1', 'h2', '.title'],
        images: ['img[src]']
      };

      scraperService = await this.getScraperService(options);
      const result = await scraperService.scrapeWebsite(url, testSelectors);

      const duration = Date.now() - startTime;

      res.json({
        success: result.success,
        data: result.data,
        debug: result.debug,
        meta: {
          url,
          duration,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('Quick scrape error:', error);
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown scraping error',
        meta: {
          duration,
          timestamp: new Date().toISOString()
        }
      });
    } finally {
      if (scraperService) {
        await scraperService.close();
      }
    }
  };

  scrapeAndSaveUltaProducts = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    let scraperService: WebScraperService | null = null;

    try {
      const validationResult = scrapeSephoraSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          details: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
        return;
      }

      const { categoryUrl, limit, options } = validationResult.data;

      scraperService = await this.getScraperService(options);
      const result = await scraperService.scrapeAndSaveUltaProducts(categoryUrl, limit);

      const duration = Date.now() - startTime;

      res.json({
        success: true,
        data: {
          scrapedProducts: result.scrapedProducts,
          totalProcessed: result.totalProcessed,
          newProductsAdded: result.newCount,
          duplicatesSkipped: result.duplicateCount,
          savedProductIds: result.savedProductIds
        },
        meta: {
          categoryUrl,
          requestedLimit: limit,
          scrapedCount: result.scrapedProducts.length,
          totalProcessed: result.totalProcessed,
          newProductsAdded: result.newCount,
          duplicatesSkipped: result.duplicateCount,
          duration,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('Ulta scrape and save error:', error);
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown scraping error',
        meta: {
          categoryUrl: req.body?.categoryUrl,
          duration,
          timestamp: new Date().toISOString()
        }
      });
    } finally {
      if (scraperService) {
        await scraperService.close();
      }
    }
  };

  // Test ingredient categorization endpoint
  categorizeIngredients = async (req: Request, res: Response): Promise<void> => {
    try {
      const { ingredients } = req.body;

      if (!ingredients || typeof ingredients !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Ingredients parameter is required and must be a string'
        });
        return;
      }

      const { OpenAIService } = await import('../services/openai');
      const openaiService = new OpenAIService();

      const categories = await openaiService.categorizeIngredients(ingredients);

      res.json({
        success: true,
        data: {
          ingredients,
          categories: categories.split(',').map(cat => cat.trim()).filter(cat => cat.length > 0),
          categoriesString: categories
        }
      });

    } catch (error) {
      console.error('Ingredient categorization error:', error);
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown categorization error'
      });
    }
  };

  // Health check for scraper service
  healthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      res.json({
        status: 'OK',
        service: 'Web Scraper',
        capabilities: [
          'General website scraping',
          'Sephora product scraping',
          'Bot detection avoidance',
          'Playwright browser automation'
        ],
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
}