import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import messagesRouter from './api/messages';
import analysisRouter from './api/analysis';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/messages', messagesRouter);
app.use('/api/analysis', analysisRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║                                                  ║
║          ClearTalk AI Server v1.0                ║
║                                                  ║
║  Server running on port ${PORT}                     ║
║  Environment: ${process.env.NODE_ENV || 'development'}                     ║
║                                                  ║
║  API Endpoints:                                  ║
║  • POST /api/messages/score                      ║
║  • POST /api/messages/rewrite                    ║
║  • POST /api/messages/suggestions                ║
║  • POST /api/messages/send                       ║
║  • POST /api/messages/shield                     ║
║  • GET  /api/messages/verify/:conversation_id    ║
║  • GET  /api/messages/conversation/:id           ║
║                                                  ║
║  • POST /api/analysis/patterns                   ║
║  • GET  /api/analysis/patterns/:conversation_id  ║
║  • GET  /api/analysis/patterns/stats/:id         ║
║  • GET  /api/analysis/shield/stats/:id           ║
║  • GET  /api/analysis/biff-history/:id           ║
║  • GET  /api/analysis/dashboard/:id              ║
║  • POST /api/analysis/batch-score                ║
║                                                  ║
║  Health Check: GET /health                       ║
║                                                  ║
╚══════════════════════════════════════════════════╝
  `);
});

export default app;
