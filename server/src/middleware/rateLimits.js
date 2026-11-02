import rateLimit from 'express-rate-limit';

const skip = () => process.env.NODE_ENV === 'test';

const base = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip,
  message: {
    message: 'Too many attempts. Please wait a few minutes and try again.',
    code: 'RATE_LIMITED',
  },
};

export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  max: 30,
});

export const emailLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  max: 12,
});

export const orderLimiter = rateLimit({
  ...base,
  windowMs: 10 * 60 * 1000,
  max: 60,
});

export const apiLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  max: 240,
});
