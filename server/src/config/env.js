import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET || (isProduction ? '' : 'slice-theory-insecure-dev-secret');

if (!jwtSecret) {
  throw new Error('JWT_SECRET must be set in production.');
}
if (isProduction && jwtSecret.includes('change-me')) {
  throw new Error('Refusing to start in production with the example JWT_SECRET.');
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  port: Number(process.env.PORT || 5000),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/slice-theory',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminEmail: (process.env.ADMIN_EMAIL || 'Demo_SliceTheory@pizza').toLowerCase(),
  adminEmailDisplay: process.env.ADMIN_EMAIL || 'Demo_SliceTheory@pizza',
  emailFrom: process.env.EMAIL_FROM || 'Slice Theory <hello@slicetheory.test>',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  lowStockCron: process.env.LOW_STOCK_CRON || '*/5 * * * *',
  lowStockCooldownHours: Number(process.env.LOW_STOCK_COOLDOWN_HOURS || 6),
  paymentsMode: (process.env.PAYMENTS_MODE || 'mock').toLowerCase(),
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  currency: process.env.CURRENCY || 'INR',
  outboxDir: path.resolve(__dirname, '../../logs/outbox'),
};

export const razorpayEnabled =
  env.paymentsMode === 'razorpay' && Boolean(env.razorpayKeyId && env.razorpayKeySecret);
