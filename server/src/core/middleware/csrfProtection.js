import { ForbiddenError } from '../errors/errorTypes.js';
import { env } from '../../config/env.js';

const CSRF_HEADER = 'x-requested-with';
const CSRF_VALUE = 'xmlhttprequest';

const PROTECTED_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const EXEMPT_PATHS = [
  '/api/auth/google',
  '/api/auth/google/callback',
  '/api/_debug/test-email',
];

export function csrfProtection(req, res, next) {
  if (!env.isProduction && !req.headers[CSRF_HEADER]) {
    return next();
  }

  if (!PROTECTED_METHODS.has(req.method)) return next();

  if (EXEMPT_PATHS.includes(req.path)) return next();

  if (env.nodeEnv === 'test') return next();

  // Requests authenticated via Bearer token are already protected from CSRF
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return next();
  }

  const header = (req.headers[CSRF_HEADER] || '').toString().toLowerCase();
  if (header !== CSRF_VALUE) {
    throw new ForbiddenError('Invalid request origin');
  }

  next();
}
