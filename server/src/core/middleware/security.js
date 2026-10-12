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


export const mongoSanitizeConfig = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
   
    console.warn(`Sanitized key: ${key} from ${req.ip}`);
  },
});


export const hppConfig = hpp({
  whitelist: [
    
    'status',
    'priority',
    'assignees',
    'labels',
  ],
});