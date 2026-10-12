
import { redis } from '../../config/redis.js';
import { RateLimitError } from '../errors/errorTypes.js';
import { logger } from '../logger/logger.js';

// ── Limiter factory ───────────────────────────────────────────────
function createLimiter({ windowMs, max, prefix }) {
    return async (req, res, next) => {
        try {
            if (redis.status !== 'ready') {
                return next();
            }

            const key = `rl:${prefix}:${req.ip}`;

            const count = await redis.incr(key);

            // Set expiry only on first request
            if (count === 1) {
                await redis.expire(key, Math.ceil(windowMs / 1000));
            }

            if (count > max) {
                logger.warn('Rate limit exceeded', {
                    ip: req.ip,
                    path: req.path,
                    prefix,
                });

                return next(new RateLimitError());
            }

            next();
        } catch (err) {
            logger.error('Rate limiting failed', {
                error: err.message,
            });

            // Fail open
            next();
        }
    };
}

// ── Tiered limiters ───────────────────────────────────────────────

// Auth endpoints — tightest limit
// Prevents brute force on login/signup/forgot-password
// 10 attempts per 15 minutes per IP
export const authLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    prefix: 'auth',
});

// General API endpoints — generous for normal use
// 60 requests per minute covers heavy dashboard usage
// without allowing systematic scraping or abuse
export const apiLimiter = createLimiter({
    windowMs: 60 * 1000,
    max: 60,
    prefix: 'api',
});

// Global fallback — applied to every route
// Last line of defense against any uncategorized abuse
export const globalLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 200,
    prefix: 'global',
});