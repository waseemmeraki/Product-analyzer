import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth';
import { analyticsRoutes } from './routes/analytics';
import { analysisRoutes } from './routes/analysis';
import { scraperRoutes } from './routes/scraper';
import productRoutes from './routes/products';
import { setupSimpleSwagger } from './swagger-simple';

// Load API-specific environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cache-Control', 'Pragma', 'Expires'],
  credentials: false
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/scraper', scraperRoutes);
app.use('/api/products', productRoutes);

app.get('/test-swagger', (req, res) => {
  res.json({ message: 'Swagger test route works' });
});

console.log('Setting up Swagger UI...');
setupSimpleSwagger(app);
console.log('Swagger UI setup complete');

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;