import { logger } from '../logger/logger.js';
import { v4 as uuidv4 } from 'uuid';

export function requestLogger(req, res, next) {
    const requestId = uuidv4();
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 500 ? 'error'
            : res.statusCode >= 400 ? 'warn'
                : 'info';

        logger[level]({
            requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userId: req.user?.id ?? 'anonymous',
            ip: req.ip,
        });
    });

    next();

}