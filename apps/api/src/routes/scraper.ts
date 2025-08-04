import { Router } from 'express';
import { ScraperController } from '../controllers/scraperController';

const router = Router();
const scraperController = new ScraperController();

/**
 * @swagger
 * /api/scraper/health:
 *   get:
 *     summary: Health check for scraper service
 *     tags: [Scraper]
 *     responses:
 *       200:
 *         description: Scraper service health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 service:
 *                   type: string
 *                 capabilities:
 *                   type: array
 *                   items:
 *                     type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/health', scraperController.healthCheck);

/**
 * @swagger
 * /api/scraper/quick:
 *   get:
 *     summary: Quick scrape a website (for testing)
 *     tags: [Scraper]
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *           format: uri
 *         description: URL to scrape
 *       - in: query
 *         name: headless
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           default: true
 *         description: Run browser in headless mode
 *       - in: query
 *         name: timeout
 *         schema:
 *           type: integer
 *           minimum: 5000
 *           maximum: 120000
 *           default: 60000
 *         description: Request timeout in milliseconds
 *     responses:
 *       200:
 *         description: Scraping results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 debug:
 *                   type: object
 *                 meta:
 *                   type: object
 *       400:
 *         description: Invalid URL or parameters
 *       500:
 *         description: Scraping failed
 */
router.get('/quick', scraperController.quickScrape);

/**
 * @swagger
 * /api/scraper/scrape:
 *   post:
 *     summary: Scrape a website with custom selectors
 *     tags: [Scraper]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: URL to scrape
 *                 example: "https://www.sephora.com/shop/skincare"
 *               selectors:
 *                 type: object
 *                 description: CSS selectors to use for scraping
 *                 additionalProperties:
 *                   type: array
 *                   items:
 *                     type: string
 *                 example:
 *                   productNames: [".ProductTile-content span", "[data-testid*='product-name']"]
 *                   productLinks: ["a[href*='/product/']", "[class*='ProductTile'] a"]
 *               options:
 *                 type: object
 *                 properties:
 *                   headless:
 *                     type: boolean
 *                     default: true
 *                   timeout:
 *                     type: integer
 *                     minimum: 5000
 *                     maximum: 120000
 *                     default: 60000
 *                   maxRetries:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                     default: 3
 *                   proxy:
 *                     type: string
 *                     description: Proxy server URL
 *     responses:
 *       200:
 *         description: Scraping successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Scraped data organized by selector keys
 *                 debug:
 *                   type: object
 *                   description: Debug information about the scraping process
 *                 meta:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     duration:
 *                       type: integer
 *                     timestamp:
 *                       type: string
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Scraping failed
 */
router.post('/scrape', scraperController.scrapeWebsite);

/**
 * @swagger
 * /api/scraper/sephora:
 *   post:
 *     summary: Scrape Sephora products from a category page
 *     tags: [Scraper]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryUrl
 *             properties:
 *               categoryUrl:
 *                 type: string
 *                 format: uri
 *                 description: Sephora category URL to scrape
 *                 example: "https://www.sephora.com/shop/skincare"
 *               limit:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 default: 20
 *                 description: Maximum number of products to scrape
 *               options:
 *                 type: object
 *                 properties:
 *                   headless:
 *                     type: boolean
 *                     default: true
 *                   timeout:
 *                     type: integer
 *                     minimum: 5000
 *                     maximum: 120000
 *                     default: 60000
 *                   maxRetries:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                     default: 3
 *                   proxy:
 *                     type: string
 *                     description: Proxy server URL
 *     responses:
 *       200:
 *         description: Products scraped successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       url:
 *                         type: string
 *                       price:
 *                         type: string
 *                       brand:
 *                         type: string
 *                       description:
 *                         type: string
 *                       ingredients:
 *                         type: string
 *                       imageUrl:
 *                         type: string
 *                 meta:
 *                   type: object
 *                   properties:
 *                     categoryUrl:
 *                       type: string
 *                     requestedLimit:
 *                       type: integer
 *                     actualCount:
 *                       type: integer
 *                     duration:
 *                       type: integer
 *                     timestamp:
 *                       type: string
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Scraping failed
 */
router.post('/sephora', scraperController.scrapeSephoraProducts);

/**
 * @swagger
 * /api/scraper/ulta:
 *   post:
 *     summary: Scrape Ulta products from a category page
 *     tags: [Scraper]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryUrl
 *             properties:
 *               categoryUrl:
 *                 type: string
 *                 format: uri
 *                 description: Ulta category URL to scrape
 *                 example: "https://www.ulta.com/shop/hair/shampoo-conditioner/shampoo"
 *               limit:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *                 default: 10
 *                 description: Maximum number of products to scrape
 *               options:
 *                 type: object
 *                 properties:
 *                   headless:
 *                     type: boolean
 *                     default: true
 *                   timeout:
 *                     type: integer
 *                     minimum: 30000
 *                     maximum: 120000
 *                     default: 60000
 *                   maxRetries:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 3
 *                     default: 2
 *     responses:
 *       200:
 *         description: Ulta products scraped successfully
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Scraping failed
 */
router.post('/ulta', scraperController.scrapeUltaProducts);

/**
 * @swagger
 * /api/scraper/ulta/save:
 *   post:
 *     summary: Scrape Ulta products and save to database
 *     tags: [Scraper]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryUrl
 *             properties:
 *               categoryUrl:
 *                 type: string
 *                 format: uri
 *                 description: Ulta category URL to scrape
 *                 example: "https://www.ulta.com/shop/hair/shampoo-conditioner/shampoo"
 *               limit:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *                 default: 10
 *                 description: Maximum number of products to scrape and save
 *               options:
 *                 type: object
 *                 properties:
 *                   headless:
 *                     type: boolean
 *                     default: true
 *                   timeout:
 *                     type: integer
 *                     minimum: 30000
 *                     maximum: 120000
 *                     default: 60000
 *                   maxRetries:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 3
 *                     default: 2
 *     responses:
 *       200:
 *         description: Products scraped and saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     scrapedProducts:
 *                       type: array
 *                       items:
 *                         type: object
 *                     savedCount:
 *                       type: integer
 *                     savedProductIds:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Scraping or saving failed
 */
router.post('/ulta/save', scraperController.scrapeAndSaveUltaProducts);

/**
 * @swagger
 * /api/scraper/categorize-ingredients:
 *   post:
 *     summary: Test ingredient categorization with OpenAI
 *     tags: [Scraper]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ingredients
 *             properties:
 *               ingredients:
 *                 type: string
 *                 description: Comma-separated list of ingredients to categorize
 *                 example: "Water, Glycerin, Niacinamide, Hyaluronic Acid, Vitamin C, Fragrance"
 *     responses:
 *       200:
 *         description: Ingredients categorized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     ingredients:
 *                       type: string
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: string
 *                     categoriesString:
 *                       type: string
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Categorization failed
 */
router.post('/categorize-ingredients', scraperController.categorizeIngredients);

export { router as scraperRoutes };