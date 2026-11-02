import { User } from '../models/User.js';
import { verifyAccessToken } from '../utils/tokens.js';
import { HttpError } from '../utils/httpError.js';
import { env } from '../config/env.js';

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

export async function authenticate(req, _res, next) {
  try {
    const token = extractToken(req);
    if (!token) throw new HttpError(401, 'Please sign in to continue.', undefined, 'UNAUTHENTICATED');
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (!user) throw new HttpError(401, 'Your session is no longer valid.', undefined, 'UNAUTHENTICATED');
    req.user = user;
    req.auth = payload;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      next(new HttpError(401, 'Your session expired. Please sign in again.', undefined, 'TOKEN_EXPIRED'));
      return;
    }
    if (error.name === 'JsonWebTokenError') {
      next(new HttpError(401, 'Invalid session token.', undefined, 'INVALID_TOKEN'));
      return;
    }
    next(error);
  }
}

export function requireVerified(req, _res, next) {
  if (!req.user?.isVerified) {
    next(new HttpError(403, 'Please verify your email address first.', undefined, 'EMAIL_UNVERIFIED'));
    return;
  }
  next();
}

export function requireAdmin(req, _res, next) {
  const isAdmin =
    req.user?.role === 'admin' || String(req.user?.email || '').toLowerCase() === env.adminEmail;
  if (!isAdmin) {
    next(new HttpError(403, 'Admin access only.', undefined, 'ADMIN_ONLY'));
    return;
  }
  next();
}
