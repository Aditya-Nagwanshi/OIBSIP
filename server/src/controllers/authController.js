import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { parseBody } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { createAccessToken, createOpaqueToken, hashToken } from '../utils/tokens.js';
import { publicUser } from '../utils/serializers.js';
import { resetEmail, sendMail, verificationEmail, isOutboxMode } from '../services/mailer.js';

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 30 * 60 * 1000;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters.')
  .max(128, 'Password is too long.')
  .regex(/[A-Za-z]/, 'Include at least one letter.')
  .regex(/[0-9]/, 'Include at least one number.');

const emailSchema = z
  .string()
  .trim()
  .min(5, 'Enter your email address.')
  .max(160)
  .transform((value) => value.toLowerCase())
  .refine((value) => emailPattern.test(value), 'Enter a valid email address.');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Tell us your name.').max(80),
  email: emailSchema,
  password: passwordSchema,
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.').max(128),
});

const adminLoginSchema = z.object({
  email: z.string().trim().min(5).max(160).transform((value) => value.toLowerCase()),
});

const tokenSchema = z.object({
  token: z.string().trim().min(20, 'Verification token is missing.').max(200),
});

const resetSchema = z.object({
  token: z.string().trim().min(20, 'Reset token is missing.').max(200),
  password: passwordSchema,
});

const resendSchema = z.object({ email: emailSchema });

function verificationUrl(rawToken) {
  return `${env.clientUrls[0]}/verify-email?token=${encodeURIComponent(rawToken)}`;
}

function resetUrl(rawToken) {
  return `${env.clientUrls[0]}/reset-password?token=${encodeURIComponent(rawToken)}`;
}

async function issueVerification(user) {
  const { raw, hash } = createOpaqueToken();
  user.verificationTokenHash = hash;
  user.verificationExpires = new Date(Date.now() + VERIFY_TTL_MS);
  await user.save();

  const email = verificationEmail({ name: user.name, url: verificationUrl(raw) });
  let mailStatus = 'failed';
  try {
    const result = await sendMail({
      to: user.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
    mailStatus = result.status;
  } catch (error) {
    console.error('[auth] Verification email failed:', error.message);
  }

  return {
    mailStatus,
    devVerifyUrl: isOutboxMode() ? verificationUrl(raw) : undefined,
  };
}

export const register = asyncHandler(async (req, res) => {
  const data = parseBody(registerSchema, req.body);

  if (data.email === env.adminEmail) {
    throw new HttpError(403, 'Admin access is provisioned separately.', undefined, 'ADMIN_SEPARATE');
  }

  const existing = await User.findOne({ email: data.email });
  if (existing) {
    throw new HttpError(409, 'An account with this email already exists. Try signing in.', undefined, 'EMAIL_EXISTS');
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await User.create({
    name: data.name,
    email: data.email,
    passwordHash,
    role: 'user',
    isVerified: false,
  });

  const verification = await issueVerification(user);

  res.status(201).json({
    message: 'Account created. Check your inbox to verify your email.',
    user: publicUser(user),
    ...(verification.devVerifyUrl ? { devVerifyUrl: verification.devVerifyUrl, mailMode: 'outbox' } : {}),
  });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = parseBody(tokenSchema, req.body);
  const user = await User.findOne({
    verificationTokenHash: hashToken(token),
    verificationExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new HttpError(400, 'This verification link is invalid or has expired.', undefined, 'INVALID_VERIFICATION');
  }

  user.isVerified = true;
  user.verificationTokenHash = undefined;
  user.verificationExpires = undefined;
  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = createAccessToken(user);
  res.json({
    message: 'Email verified. Welcome to Slice Theory!',
    token: accessToken,
    user: publicUser(user),
  });
});

export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = parseBody(resendSchema, req.body);
  const user = await User.findOne({ email });
  let devVerifyUrl;

  if (user && !user.isVerified && user.role !== 'admin') {
    const verification = await issueVerification(user);
    devVerifyUrl = verification.devVerifyUrl;
  }

  res.json({
    message: 'If that account needs verification, a fresh link is on its way.',
    ...(devVerifyUrl ? { devVerifyUrl, mailMode: 'outbox' } : {}),
  });
});

export const login = asyncHandler(async (req, res) => {
  const data = parseBody(loginSchema, req.body);

  if (data.email === env.adminEmail) {
    throw new HttpError(
      403,
      'This is an admin email. Use the Admin Studio login.',
      { adminLogin: true },
      'USE_ADMIN_LOGIN'
    );
  }

  const user = await User.findOne({ email: data.email }).select('+passwordHash');
  if (!user || !user.passwordHash) {
    throw new HttpError(401, 'Email or password is incorrect.', undefined, 'INVALID_CREDENTIALS');
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) {
    throw new HttpError(401, 'Email or password is incorrect.', undefined, 'INVALID_CREDENTIALS');
  }

  if (!user.isVerified) {
    throw new HttpError(
      403,
      'Please verify your email before signing in.',
      { email: user.email },
      'EMAIL_UNVERIFIED'
    );
  }

  user.lastLoginAt = new Date();
  await user.save();

  res.json({
    message: 'Welcome back!',
    token: createAccessToken(user),
    user: publicUser(user),
  });
});

export const adminLogin = asyncHandler(async (req, res) => {
  const { email } = parseBody(adminLoginSchema, req.body);

  if (email !== env.adminEmail) {
    throw new HttpError(401, 'That email is not authorised for Admin Studio.', undefined, 'ADMIN_EMAIL_MISMATCH');
  }

  let admin = await User.findOne({ email });
  if (!admin) {
    admin = await User.create({
      name: 'Slice Theory Admin',
      email,
      role: 'admin',
      isVerified: true,
    });
  } else if (admin.role !== 'admin') {
    admin.role = 'admin';
    admin.isVerified = true;
    await admin.save();
  }

  admin.lastLoginAt = new Date();
  await admin.save();

  res.json({
    message: 'Admin access granted. Passwordless demo mode is active.',
    token: createAccessToken(admin),
    user: publicUser(admin),
    passwordless: true,
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = parseBody(resendSchema, req.body);
  const user = await User.findOne({ email });
  let devResetUrl;

  if (user && user.role !== 'admin') {
    const { raw, hash } = createOpaqueToken();
    user.resetTokenHash = hash;
    user.resetExpires = new Date(Date.now() + RESET_TTL_MS);
    await user.save();

    const emailContent = resetEmail({ name: user.name, url: resetUrl(raw) });
    try {
      const result = await sendMail({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });
      if (result.status === 'outbox' && isOutboxMode()) devResetUrl = resetUrl(raw);
    } catch (error) {
      console.error('[auth] Reset email failed:', error.message);
    }
  }

  res.json({
    message: 'If an account exists for that email, a password reset link has been sent.',
    ...(devResetUrl ? { devResetUrl, mailMode: 'outbox' } : {}),
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = parseBody(resetSchema, req.body);
  const user = await User.findOne({
    resetTokenHash: hashToken(token),
    resetExpires: { $gt: new Date() },
  }).select('+passwordHash');

  if (!user) {
    throw new HttpError(400, 'This reset link is invalid or has expired.', undefined, 'INVALID_RESET');
  }

  user.passwordHash = await bcrypt.hash(password, 12);
  user.resetTokenHash = undefined;
  user.resetExpires = undefined;
  user.verificationTokenHash = undefined;
  user.verificationExpires = undefined;
  user.isVerified = true;
  await user.save();

  res.json({
    message: 'Password updated. You are signed in.',
    token: createAccessToken(user),
    user: publicUser(user),
  });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export const updateMe = asyncHandler(async (req, res) => {
  const schema = z.object({
    name: z.string().trim().min(2).max(80).optional(),
    phone: z.string().trim().max(20).optional(),
  });
  const data = parseBody(schema, req.body);
  if (data.name) req.user.name = data.name;
  if (data.phone !== undefined) req.user.phone = data.phone;
  await req.user.save();
  res.json({ message: 'Profile updated.', user: publicUser(req.user) });
});
