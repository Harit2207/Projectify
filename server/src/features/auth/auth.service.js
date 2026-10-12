import crypto from 'crypto';
import { User } from './auth.model.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../shared/utils/jwt.js';
import {
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearAuthCookies,
} from '../../shared/utils/cookie.js';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
} from '../../core/errors/errorTypes.js';
import { logger } from '../../core/logger/logger.js';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../../core/services/email.service.js';

function issueTokens(res, userId) {
  const payload = { userId: userId.toString() };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken);
}

export async function signup({ name, email, password }, res) {
  const existing = await User.findOne({ email });
  if (existing) throw new ConflictError('Email already registered');

  const user = await User.create({ name, email, password });

  logger.info('New user registered', { userId: user._id });

  issueTokens(res, user._id);

  // Background welcome email dispatch
  sendWelcomeEmail({ to: user.email, userName: user.name });

  return user.toSafeObject();
}

// ── Login ─────────────────────────────────────────────────────────
export async function login({ email, password }, res) {
  const user = await User.findOne({ email }).select('+password');

  if (!user || !user.password) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid email or password');
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  logger.info('User logged in', { userId: user._id });

  issueTokens(res, user._id);

  return user.toSafeObject();
}

// ── Get current user ──────────────────────────────────────────────
export async function getMe(user) {
  return user.toSafeObject();
}

// ── Logout ────────────────────────────────────────────────────────
export async function logout(res) {
  clearAuthCookies(res);
}

// ── Refresh token ─────────────────────────────────────────────────
export async function refresh(refreshToken, res) {
  if (!refreshToken) {
    throw new UnauthorizedError('No refresh token provided');
  }

  const decoded = verifyRefreshToken(refreshToken);

  const user = await User.findById(decoded.userId);
  if (!user) throw new UnauthorizedError('User not found');

  const accessToken = signAccessToken({ userId: user._id.toString() });
  setAccessTokenCookie(res, accessToken);

  return user.toSafeObject();
}

export async function handleGoogleCallback(user, res) {
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  issueTokens(res, user._id);

  logger.info('Google OAuth login', { userId: user._id });
}

// ── Forgot password ───────────────────────────────────────────────
export async function forgotPassword(email) {
  const user = await User.findOne({ email });
  if (!user) {
    // Return success to avoid email enumeration
    return { message: 'If an account exists for that email, a password reset link has been sent' };
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

  await sendPasswordResetEmail({
    to: user.email,
    resetUrl,
    userName: user.name,
  });

  logger.info('Password reset email triggered', { userId: user._id });
  return { message: 'Password reset link sent successfully' };
}

// ── Reset password ────────────────────────────────────────────────
export async function resetPassword({ token, password }) {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    throw new BadRequestError('Password reset link is invalid or has expired');
  }

  user.password = password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  logger.info('Password reset completed', { userId: user._id });
  return { message: 'Password has been reset successfully' };
}
