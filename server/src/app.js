
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import passport from 'passport';

import { env } from './config/env.js';
import { logger } from './core/logger/logger.js';
import { errorHandler } from './core/errors/errorHandler.js';
import { globalLimiter } from './core/middleware/rateLimiter.js';
import { hppConfig } from './core/middleware/security.js';
import { csrfProtection } from './core/middleware/csrfProtection.js';
import { requestLogger } from './core/middleware/requestLogger.js';

import './config/passport.js';

import { authRouter } from './features/auth/auth.routes.js';
import { workspaceRouter } from './features/workspace/workspace.routes.js';
import { projectRouter } from './features/projects/projects.routes.js';
import { taskRouter } from './features/tasks/tasks.routes.js';
import { analyticsRouter } from './features/analytics/analytics.routes.js';
import { notificationRouter } from './features/notification/notification.routes.js';

const app = express();

// Trust proxy in production
if (env.isProduction) {
  app.set('trust proxy', 1);
}

// Security and request middleware
app.use(helmet());

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  }),
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(hppConfig);
app.use(requestLogger);
app.use(globalLimiter);
app.use(csrfProtection);
app.use(passport.initialize());

app.use(
  morgan('combined', {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  }),
);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/workspaces', workspaceRouter);
app.use('/api/workspaces/:workspaceId/projects', projectRouter);
app.use('/api/workspaces/:workspaceId', taskRouter);
app.use('/api/workspaces/:workspaceId', analyticsRouter);
app.use('/api/notifications', notificationRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Global error handler
app.use(errorHandler);


export { app };
export default app;