import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';

import config from './app/config';
import { globalErrorHandler } from './app/middlewares/globalErrorHandler';
import { notFound } from './app/middlewares/notFound';
import { apiRateLimiter } from './app/middlewares/rateLimiter';
import router from './app/routes';

const app: Application = express();

// Security and utility middlewares
app.use(helmet());

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://devassess.com',
  ...(config.frontendPublicUrl ? [config.frontendPublicUrl] : []),
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || config.env === 'development') {
        return callback(null, true);
      }
      return callback(new Error('CORS policy: This origin is not allowed'));
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root welcome route
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to DevAssess API',
    data: {
      version: '1.0.0',
      status: 'healthy',
      docs: '/api/v1/docs',
    },
  });
});

// Health check endpoint
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'DevAssess API is healthy and operational',
    data: {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// Application v1 routes with rate limiting
app.use('/api/v1', apiRateLimiter, router);

// Error handling middlewares
app.use(notFound);
app.use(globalErrorHandler);

export default app;
