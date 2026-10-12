import { AppError } from './AppError.js';

export class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'You do not have permission to perform this action') {
        super(message, 403, 'FORBIDDEN');
    }
}

export class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, 409, 'CONFLICT');
    }
}

export class BadRequestError extends AppError {
    constructor(message = 'Bad request') {
        super(message, 400, 'BAD_REQUEST');
    }
}

export class RateLimitError extends AppError {
  constructor() {
    super(
      'Too many requests. Please slow down.',
      429,
      'RATE_LIMIT_EXCEEDED',
    );
  }
}

export class ValidationError extends AppError {
    constructor(message = 'Validation failed', errors = []) {
        const detailedMsg = errors && errors.length > 0
            ? errors.map(e => e.message).join(', ')
            : message;
        super(detailedMsg, 400, 'VALIDATION_ERROR');

        this.errors = errors;
    }
}
