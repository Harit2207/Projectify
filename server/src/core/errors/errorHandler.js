import { AppError } from './AppError.js';
import { logger } from '../logger/logger.js';
import { env } from '../../config/env.js';

export function errorHandler(err, req, res, next) {
    logger.error({
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        statusCode: err.statusCode,
        errorCode: err.errorCode,
        userId: req.user?.id,
    });
 // Known operational error
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      errorCode: err.errorCode,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      errorCode: 'CONFLICT',
      message: `${field} already exists`,
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(422).json({
      success: false,
      errorCode: 'VALIDATION_ERROR',
      message: 'Validation failed',
      errors,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      errorCode: 'INVALID_TOKEN',
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      errorCode: 'TOKEN_EXPIRED',
      message: 'Token expired',
    });
  }

  
  return res.status(500).json({
    success: false,
    errorCode: 'INTERNAL_ERROR',
    message: env.isProduction
      ? 'Something went wrong'
      : err.message, // Show real message in dev
  });

}