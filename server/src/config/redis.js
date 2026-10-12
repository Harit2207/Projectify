import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '../core/logger/logger.js';

export const redis = new Redis(env.redisUrl, {
  maxRetriesPerRequest: 1,
  retryStrategy(times) {
    if (times > 2) {
      return null;
    }
    return 500;
  },
  tls: env.redisUrl.startsWith('rediss://') ? {} : undefined,
  keepAlive: 30000,
  enableAutoPipelining: false,
  lazyConnect: true,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('ready', () => logger.info('Redis ready'));
redis.on('error', (err) => logger.warn('Redis error (continuing without cache)', { error: err.message }));
redis.on('reconnecting', () => logger.warn('Redis reconnecting...'));

export async function connectRedis() {
  if (redis.status === 'ready') {
    logger.info('Redis already connected');
    return;
  }

  try {
    await Promise.race([
      redis.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ]);
  } catch (err) {
    logger.warn('Redis not available. Rate limiting will run in fallback mode.');
  }
}