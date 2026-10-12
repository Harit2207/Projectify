
import { createServer } from 'http';

import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { connectRedis } from './config/redis.js';
import { initSocket } from './config/socket.js';
import { logger } from './core/logger/logger.js';

async function bootstrap() {
  try {
    await connectDB();
    await connectRedis();

    const httpServer = createServer(app);

    initSocket(httpServer);

    httpServer.listen(env.port, () => {
      logger.info(
        `Server running on port ${env.port} [${env.nodeEnv}]`,
      );
    });

    return httpServer;
  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
    });

    process.exitCode = 1;
  }
}

bootstrap();