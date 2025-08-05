import { Router } from 'express';
import { AnalysisController } from '../controllers/analysisController';

const router = Router();
const analysisController = new AnalysisController();

/**
 * @swagger
 * /api/analysis:
 *   post:
 *     summary: Analyze cosmetic products for ingredient and claim intelligence
 *     tags: [Analysis]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productIds
 *             properties:
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of product UUIDs to analyze
 *                 example: ["123e4567-e89b-12d3-a456-426614174000", "987fcdeb-51a2-43d1-9f12-123456789abc"]
 *     responses:
 *       200:
 *         description: Analysis results
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
 *                     productsAnalyzed:
 *                       type: number
 *                     productsRequested:
 *                       type: number
 *                     analysis:
 *                       type: object
 *                       properties:
 *                         trending:
 *                           type: array
 *                           items:
 *                             type: string
 *                         emerging:
 *                           type: array
 *                           items:
 *                             type: string
 *                         declining:
 *                           type: array
 *                           items:
 *                             type: string
 *                         insights:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               type:
 *                                 type: string
 *                                 enum: [ingredient, claim, category]
 *                               name:
 *                                 type: string
 *                               supportingFact:
 *                                 type: string
 *       400:
 *         description: Invalid request format
 *       404:
 *         description: No products found
 *       500:
 *         description: Analysis failed
 */
router.post('/', analysisController.analyzeProducts);

/**
 * @swagger
 * /api/analysis/health:
 *   get:
 *     summary: Health check for analysis service
 *     tags: [Analysis]
 *     responses:
 *       200:
 *         description: Service health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                     openai:
 *                       type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/health', analysisController.healthCheck);

/**
 * @swagger
 * /api/analysis/cache:
 *   get:
 *     summary: Get analysis cache statistics and management
 *     tags: [Analysis]
 *     parameters:
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [stats, clear, cleanup]
 *         description: Cache action to perform (default is stats)
 *     responses:
 *       200:
 *         description: Cache statistics or action result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 cache:
 *                   type: object
 *                   properties:
 *                     totalEntries:
 *                       type: number
 *                     validEntries:
 *                       type: number
 *                     expiredEntries:
 *                       type: number
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/cache', analysisController.manageCacheStats);

/**
 * @swagger
 * /api/analysis/export/pdf:
 *   post:
 *     summary: Export analysis report as PDF
 *     tags: [Analysis]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productIds
 *             properties:
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of product UUIDs to analyze and export
 *                 example: ["123e4567-e89b-12d3-a456-426614174000", "987fcdeb-51a2-43d1-9f12-123456789abc"]
 *               selectedCategory:
 *                 type: string
 *                 description: Category name for context in the PDF report
 *                 example: "Skincare"
 *     responses:
 *       200:
 *         description: PDF report file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             description: Attachment filename
 *             schema:
 *               type: string
 *               example: "attachment; filename=\"Analysis_Report_Skincare_2025-01-15.pdf\""
 *       400:
 *         description: Invalid request format
 *       404:
 *         description: No products found
 *       500:
 *         description: PDF generation failed
 */
router.post('/export/pdf', analysisController.exportToPDF);

export { router as analysisRoutes };