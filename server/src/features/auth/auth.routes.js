import { Router } from 'express';
import passport from 'passport';
import { validate } from '../../core/middleware/validate.js';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authLimiter } from '../../core/middleware/rateLimiter.js';
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

// Email / Password Auth routes
router.post('/signup', validate(signupSchema), signupController);
router.post('/login', validate(loginSchema), loginController);
router.post('/logout', authenticate, logoutController);
router.post('/refresh', refreshController);

// Password Reset routes
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPasswordController);
router.post('/reset-password', validate(resetPasswordSchema), resetPasswordController);

router.get('/me', authenticate, getMeController);

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    prompt: 'select_account',
  }),
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://projectify-steel.vercel.app'}/login?error=google_failed`,
  }),
  googleCallbackController,
);

export { router as authRouter };
