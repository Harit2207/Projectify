import { Router } from 'express';
import passport from 'passport';
import { validate } from '../../core/middleware/validate.js';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authLimiter } from '../../core/middleware/rateLimiter.js';
import { env } from '../../config/env.js';
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.schema.js';
import {
  signupController,
  loginController,
  getMeController,
  logoutController,
  refreshController,
  googleCallbackController,
  forgotPasswordController,
  resetPasswordController,
} from './auth.controller.js';

const router = Router();

router.use(authLimiter);

// Public auth configuration status
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      googleAuthEnabled: env.google.isConfigured,
    },
  });
});

// Email / Password Auth routes
router.post('/signup', validate(signupSchema), signupController);
router.post('/login', validate(loginSchema), loginController);
router.post('/logout', authenticate, logoutController);
router.post('/refresh', refreshController);

// Password Reset routes
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPasswordController);
router.post('/reset-password', validate(resetPasswordSchema), resetPasswordController);

router.get('/me', authenticate, getMeController);

// Google OAuth routes with graceful missing-credential handling
router.get('/google', (req, res, next) => {
  if (!env.google.isConfigured) {
    const targetUrl = env.frontendUrl || env.clientUrl || 'https://projectify-steel.vercel.app';
    return res.redirect(`${targetUrl}/login?error=google_not_configured`);
  }
  return passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    prompt: 'select_account',
  })(req, res, next);
});

router.get(
  '/google/callback',
  (req, res, next) => {
    if (!env.google.isConfigured) {
      const targetUrl = env.frontendUrl || env.clientUrl || 'https://projectify-steel.vercel.app';
      return res.redirect(`${targetUrl}/login?error=google_not_configured`);
    }
    const failureUrl = `${env.frontendUrl || env.clientUrl || 'https://projectify-steel.vercel.app'}/login?error=google_failed`;
    return passport.authenticate('google', {
      session: false,
      failureRedirect: failureUrl,
    })(req, res, next);
  },
  googleCallbackController,
);

export { router as authRouter };
