import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as authService from '../services/authService';
import { AuthRequest } from '../types';
import * as R from '../utils/response';

const registerSchema = z.object({
  email:    z.string().email(),
  name:     z.string().min(2).max(80),
  password: z.string().min(8).max(100),
  role:     z.enum(['admin', 'candidate', 'viewer', 'recruiter']).optional(),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8).max(100),
});

const updateMeSchema = z.object({
  name: z.string().min(2).max(80).optional(),
});

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/',
};

function setRefreshCookie(res: Response, token: string): void {
  res.cookie('refreshToken', token, COOKIE_OPTS);
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = registerSchema.parse(req.body);
    const result = await authService.register(dto);
    setRefreshCookie(res, result.refreshToken);
    R.created(res, result, 'Registration successful');
  } catch (err) { next(err); }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = loginSchema.parse(req.body);
    const result = await authService.login(dto, req.ip, req.headers['user-agent']);
    setRefreshCookie(res, result.refreshToken);
    R.ok(res, result, 'Login successful');
  } catch (err) { next(err); }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Accept token from httpOnly cookie (preferred) or request body (fallback)
    const token = (req.cookies as Record<string, string>)?.refreshToken ?? req.body?.refreshToken;
    if (!token) { R.badRequest(res, 'refreshToken required'); return; }
    const result = await authService.refreshTokens(token as string);
    setRefreshCookie(res, result.refreshToken);
    R.ok(res, result, 'Tokens refreshed');
  } catch (err) { next(err); }
}

export async function logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.headers.authorization!.slice(7);
    await authService.logout(req.user!.sub, token);
    res.clearCookie('refreshToken', { path: '/' });
    R.ok(res, null, 'Logged out successfully');
  } catch (err) { next(err); }
}

export async function me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { prisma } = await import('../config/database');
    const user = await prisma.user.findUnique({
      where:  { id: req.user!.sub },
      select: { id: true, email: true, name: true, role: true, isActive: true, emailVerified: true, createdAt: true, lastLoginAt: true },
    });
    if (!user) { R.notFound(res, 'User not found'); return; }
    R.ok(res, user);
  } catch (err) { next(err); }
}

export async function updateMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name } = updateMeSchema.parse(req.body);
    const { prisma } = await import('../config/database');
    const user = await prisma.user.update({
      where:  { id: req.user!.sub },
      data:   { ...(name ? { name } : {}) },
      select: { id: true, email: true, name: true, role: true, isActive: true, emailVerified: true, createdAt: true, lastLoginAt: true },
    });
    R.ok(res, user, 'Profile updated');
  } catch (err) { next(err); }
}

export async function changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    await authService.changePassword(req.user!.sub, currentPassword, newPassword);
    R.ok(res, null, 'Password changed successfully');
  } catch (err) { next(err); }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = z.object({ token: z.string().min(1) }).parse(req.query);
    await authService.verifyEmail(token);
    R.ok(res, null, 'Email verified successfully');
  } catch (err) { next(err); }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    await authService.requestPasswordReset(email);
    R.ok(res, null, 'If that email is registered, a reset link has been sent');
  } catch (err) { next(err); }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, password } = z.object({
      token:    z.string().min(1),
      password: z.string().min(8).max(100),
    }).parse(req.body);
    await authService.resetPassword(token, password);
    R.ok(res, null, 'Password reset successfully');
  } catch (err) { next(err); }
}

export async function inviteUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, role } = z.object({
      email: z.string().email(),
      role:  z.enum(['admin', 'candidate', 'viewer', 'recruiter']).default('candidate'),
    }).parse(req.body);
    await authService.inviteUser(req.user!.email, email, role as 'admin' | 'candidate' | 'viewer' | 'recruiter');
    R.ok(res, null, 'Invitation sent');
  } catch (err) { next(err); }
}

export async function acceptInvite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = z.object({
      token:    z.string().min(1),
      name:     z.string().min(2).max(80),
      password: z.string().min(8).max(100),
    }).parse(req.body);
    const result = await authService.acceptInvite(dto.token, dto.name, dto.password);
    setRefreshCookie(res, result.refreshToken);
    R.created(res, result, 'Account created successfully');
  } catch (err) { next(err); }
}
