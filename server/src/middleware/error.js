import { ZodError } from 'zod';
import { HttpError } from '../utils/httpError.js';
import { env } from '../config/env.js';

export function notFound(req, _res, next) {
  next(new HttpError(404, `Route ${req.method} ${req.originalUrl} was not found.`, undefined, 'NOT_FOUND'));
}

export function errorHandler(error, req, res, _next) {
  let status = error.status || 500;
  let message = error.message || 'Something went wrong.';
  let details = error.details;
  let code = error.code;

  if (error instanceof ZodError) {
    status = 422;
    message = 'Please check the highlighted fields.';
    code = 'VALIDATION_ERROR';
    details = error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
  } else if (error.name === 'ValidationError' && error.errors) {
    status = 422;
    message = 'Some values are invalid.';
    code = 'VALIDATION_ERROR';
    details = Object.values(error.errors).map((entry) => ({
      path: entry.path,
      message: entry.message,
    }));
  } else if (error.code === 11000) {
    status = 409;
    message = 'That value is already in use.';
    code = 'DUPLICATE_KEY';
    details = error.keyValue;
  } else if (error.name === 'CastError') {
    status = 400;
    message = 'Invalid identifier supplied.';
    code = 'INVALID_ID';
  }

  if (status >= 500) {
    console.error('[error]', error);
  }

  const payload = { message };
  if (details) payload.details = details;
  if (code) payload.code = code;
  if (!env.isProduction && status >= 500) payload.stack = error.stack;

  res.status(status).json(payload);
}
