import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get dashboard analytics data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
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
 *                     totalEvents:
 *                       type: number
 *                       description: Total number of events
 *                     totalUsers:
 *                       type: number
 *                       description: Total number of users
 *                     totalProjects:
 *                       type: number
 *                       description: Total number of projects
 *                     recentEvents:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Event'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/dashboard', analyticsController.getDashboard);

/**
 * @swagger
 * /api/analytics/events:
 *   post:
 *     summary: Track a new event
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Event name
 *               properties:
 *                 type: object
 *                 description: Event properties
 *               projectId:
 *                 type: string
 *                 description: Project ID
 *     responses:
 *       200:
 *         description: Event tracked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/events', analyticsController.trackEvent);

/**
 * @swagger
 * /api/analytics/reports/{type}:
 *   get:
 *     summary: Generate analytics report
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: type
 *         in: path
 *         required: true
 *         description: Report type
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, custom]
 *       - name: startDate
 *         in: query
 *         description: Start date for report (ISO format)
 *         schema:
 *           type: string
 *           format: date-time
 *       - name: endDate
 *         in: query
 *         description: End date for report (ISO format)
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/reports/:type', analyticsController.getReport);

export { router as analyticsRoutes };