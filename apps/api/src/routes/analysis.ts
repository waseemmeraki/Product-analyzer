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

export { router as analysisRoutes };