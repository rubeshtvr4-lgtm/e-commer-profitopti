import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { PasswordResetToken } from '../models/PasswordResetToken.js';
import { generateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { ENV } from '../config/env.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: ENV.NODE_ENV === 'production',
  sameSite: (ENV.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password, businessName } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(409).json({
      success: false,
      error: 'An account with this email address already exists.',
    });
    return;
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    passwordHash,
    businessName,
  });

  const token = generateToken(user._id.toString());
  res.cookie('token', token, COOKIE_OPTIONS);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        businessName: user.businessName,
        currency: user.currency,
        timezone: user.timezone,
        expenseCategories: user.expenseCategories,
      },
      token,
    },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    res.status(401).json({
      success: false,
      error: 'Invalid email or password.',
    });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    res.status(401).json({
      success: false,
      error: 'Invalid email or password.',
    });
    return;
  }

  const token = generateToken(user._id.toString());
  res.cookie('token', token, COOKIE_OPTIONS);

  res.json({
    success: true,
    message: 'Logged in successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        businessName: user.businessName,
        currency: user.currency,
        timezone: user.timezone,
        expenseCategories: user.expenseCategories,
      },
      token,
    },
  });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie('token', COOKIE_OPTIONS);
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  res.json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        businessName: req.user.businessName,
        currency: req.user.currency,
        timezone: req.user.timezone,
        expenseCategories: req.user.expenseCategories,
      },
    },
  });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // Return standard success response to avoid account enumeration
    res.json({
      success: true,
      message: 'If an account with that email exists, reset instructions have been dispatched.',
    });
    return;
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  await PasswordResetToken.create({
    userId: user._id,
    tokenHash,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  });

  res.json({
    success: true,
    message: 'Password reset token generated.',
    // In development mode or demonstration, we include token in response
    ...(ENV.NODE_ENV !== 'production' && { demoResetToken: rawToken }),
  });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, newPassword } = req.body;

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const record = await PasswordResetToken.findOne({
    tokenHash,
    used: false,
    expiresAt: { $gt: new Date() },
  });

  if (!record) {
    res.status(400).json({
      success: false,
      error: 'Password reset token is invalid or has expired.',
    });
    return;
  }

  const user = await User.findById(record.userId);
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found.' });
    return;
  }

  const salt = await bcrypt.genSalt(12);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  await user.save();

  record.used = true;
  await record.save();

  res.json({
    success: true,
    message: 'Your password has been successfully reset. You can now log in.',
  });
}

export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { name, businessName, currency, timezone, expenseCategories } = req.body;
  const user = req.user!;

  if (name) user.name = name;
  if (businessName) user.businessName = businessName;
  if (currency) user.currency = currency;
  if (timezone) user.timezone = timezone;
  if (expenseCategories && Array.isArray(expenseCategories)) {
    user.expenseCategories = expenseCategories;
  }

  await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        businessName: user.businessName,
        currency: user.currency,
        timezone: user.timezone,
        expenseCategories: user.expenseCategories,
      },
    },
  });
}

export async function changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { currentPassword, newPassword } = req.body;
  const user = req.user!;

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    res.status(400).json({
      success: false,
      error: 'Current password does not match.',
    });
    return;
  }

  const salt = await bcrypt.genSalt(12);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully.',
  });
}
