import asyncHandler from 'express-async-handler';
import * as authService from './auth.service.js';
import { sendSuccess, sendCreated } from '../../shared/utils/response.js';
import { env } from '../../config/env.js';

export const signupController = asyncHandler(async (req, res) => {
  const user = await authService.signup(req.body, res);
  sendCreated(res, { user }, 'Account created successfully');
});

export const loginController = asyncHandler(async (req, res) => {
  const user = await authService.login(req.body, res);
  sendSuccess(res, { user }, 'Login successful');
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
  const user = await authService.refresh(req.cookies?.refreshToken, res);
  sendSuccess(res, { user }, 'Token refreshed');
});

export const googleCallbackController = asyncHandler(async (req, res) => {
  await authService.handleGoogleCallback(req.user, res);
  res.redirect(`${env.clientUrl}/dashboard`);
});

export const forgotPasswordController = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  sendSuccess(res, result, result.message);
});

export const resetPasswordController = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body);
  sendSuccess(res, result, result.message);
});
