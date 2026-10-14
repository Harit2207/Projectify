import asyncHandler from 'express-async-handler';
import * as authService from './auth.service.js';
import { sendSuccess, sendCreated } from '../../shared/utils/response.js';
import { env } from '../../config/env.js';

export const signupController = asyncHandler(async (req, res) => {
  const { user, accessToken } = await authService.signup(req.body, res);
  sendCreated(res, { user, accessToken }, 'Account created successfully');
});

export const loginController = asyncHandler(async (req, res) => {
  const { user, accessToken } = await authService.login(req.body, res);
  sendSuccess(res, { user, accessToken }, 'Login successful');
});

export const getMeController = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user);
  sendSuccess(res, { user });
});

export const logoutController = asyncHandler(async (req, res) => {
  await authService.logout(res);
  sendSuccess(res, null, 'Logged out successfully');
});

export const refreshController = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken || bearerToken;
  const { user, accessToken } = await authService.refresh(refreshToken, res);
  sendSuccess(res, { user, accessToken }, 'Token refreshed');
});

export const googleCallbackController = asyncHandler(async (req, res) => {
  const result = await authService.handleGoogleCallback(req.user, res);
  const targetUrl = env.frontendUrl || env.clientUrl || 'https://projectify-steel.vercel.app';
  // Pass accessToken as query parameter so cross-domain SPAs can authenticate immediately even when third-party cookies are blocked
  res.redirect(`${targetUrl}/dashboard?token=${encodeURIComponent(result.accessToken)}`);
});

export const forgotPasswordController = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  sendSuccess(res, result, result.message);
});

export const resetPasswordController = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body);
  sendSuccess(res, result, result.message);
});
