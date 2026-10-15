import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';

import { globalErrorHandler } from './app/middlewares/globalErrorHandler';
import { notFound } from './app/middlewares/notFound';

const app: Application = express();

// Security and utility middlewares
app.use(helmet());
app.use(
  cors({
    origin: ['http://localhost:3000', 'https://devassess.com'],
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

// Global error handler & 404 handler
app.use(globalErrorHandler);
app.use(notFound);

export default app;
