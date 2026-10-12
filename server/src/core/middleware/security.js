import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import { env } from '../../config/env.js';

export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", env.clientUrl],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: env.isProduction ? [] : null,
    },
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  hsts: env.isProduction
    ? { maxAge: 31536000, includeSubDomains: true }
    : false,
  hidePoweredBy: true,
});

// Express 5 compatible sanitization middleware:
// Mutates req.body, req.params, and req.query in place without reassigning getter-only req.query
export const mongoSanitizeConfig = (req, res, next) => {
  if (req.body) {
    mongoSanitize.sanitize(req.body, { replaceWith: '_' });
  }
  if (req.params) {
    mongoSanitize.sanitize(req.params, { replaceWith: '_' });
  }
  if (req.query) {
    mongoSanitize.sanitize(req.query, { replaceWith: '_' });
  }
  next();
};

export const hppConfig = hpp({
  whitelist: [
    'status',
    'priority',
    'assignees',
    'labels',
  ],
});
