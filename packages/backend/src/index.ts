import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { connectDatabase, prisma } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import rateLimit from 'express-rate-limit';
import { notificationService } from './services/notificationService';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { performanceMonitor } from './middleware/performanceMonitor';

// Import routes
import authRoutes from './routes/authRoutes';
import storyRoutes from './routes/storyRoutes';
import clipRoutes from './routes/clipRoutes';
import socialRoutes from './routes/socialRoutes';
import aiRoutes from './routes/aiRoutes';
import uploadRoutes from './routes/uploadRoutes';
import templateRoutes from './routes/templateRoutes';
import photoSessionRoutes from './routes/photoSessionRoutes';
import referenceRoutes from './routes/referenceRoutes';
import qualityRoutes from './routes/qualityRoutes';
import webhookRoutes from './routes/webhookRoutes';
import searchRoutes from './routes/searchRoutes';

// Import workers (starts processing queues)
import './workers/videoGenerationWorker';
import './workers/photoSessionWorker';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(performanceMonitor.middleware());
app.use('/api/', limiter);

// Static file serving for uploads
const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || '/tmp/uploads';
app.use('/uploads', express.static(LOCAL_STORAGE_PATH));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Documentation (Swagger)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'DesignVerse API Docs',
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/clips', clipRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', uploadRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/photo', photoSessionRoutes);
app.use('/api/references', referenceRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/search', searchRoutes);
app.use('/webhooks', webhookRoutes); // No /api prefix for webhooks

// Performance stats endpoint
app.get('/api/performance/stats', (req: Request, res: Response) => {
  const stats = performanceMonitor.getStats();
  res.json({ success: true, data: stats });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Create HTTP server for both Express and Socket.IO
const httpServer = http.createServer(app);

// Initialize WebSocket server
notificationService.initialize(httpServer);

// Start server
const startServer = async () => {
  try {
    await connectDatabase();

    // Make prisma available in controllers
    app.locals.prisma = prisma;

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API available at http://localhost:${PORT}/api`);
      console.log(`🔌 WebSocket available at ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

startServer();

export default app;
