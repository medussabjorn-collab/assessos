import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma, redis } from '../config/database';
import { env } from '../config/env';
import { generateTokens, verifyRefreshToken } from '../middleware/auth';
import { logAudit } from '../middleware/audit';
import { AppError } from '../middleware/errorHandler';
import {
  sendEmail,
  verifyEmailTemplate,
  resetPasswordTemplate,
  inviteUserTemplate,
} from './emailService';
import { JwtPayload, UserRole } from '../types';

const EMAIL_VERIFY_PREFIX = 'email_verify:';
const PASSWORD_RESET_PREFIX = 'pwd_reset:';
const INVITE_PREFIX = 'invite:';

const REFRESH_PREFIX = 'refresh:';

export interface RegisterDto {
  email:    string;
  name:     string;
  password: string;
  role?:    UserRole;
}

export interface LoginDto {
  email:    string;
  password: string;
}

export interface AuthTokens {
  accessToken:  string;
  refreshToken: string;
  user: {
    id:    string;
    email: string;
    name:  string;
    role:  UserRole;
  };
}

export async function register(dto: RegisterDto): Promise<AuthTokens> {
  const existing = await prisma.user.findUnique({ where: { email: dto.email } });
  if (existing) throw new AppError(409, 'Email already registered');

  const passwordHash = await bcrypt.hash(dto.password, env.BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email:        dto.email,
      name:         dto.name,
      passwordHash,
      role:         dto.role ?? 'candidate',
    },
  });

  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    sub:   user.id,
    email: user.email,
    role:  user.role as UserRole,
  };
  const tokens = generateTokens(payload);
  await storeRefreshToken(user.id, tokens.refreshToken);

  void logAudit(user.id, 'register', 'users', user.id);

  // Send verification email (non-blocking)
  void sendVerificationEmail(user.id, user.email, user.name);

  return {
    ...tokens,
    user: { id: user.id, email: user.email, name: user.name, role: user.role as UserRole },
  };
}

export async function sendVerificationEmail(userId: string, email: string, name: string): Promise<void> {
  const token = crypto.randomBytes(32).toString('hex');
  await redis.setex(`${EMAIL_VERIFY_PREFIX}${token}`, 24 * 3600, userId);
  const verifyUrl = `${env.APP_URL}/verify-email?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Verify your email — LeaderAssess Pro',
    html: verifyEmailTemplate(name, verifyUrl),
    text: `Verify your email: ${verifyUrl}`,
  });
}

export async function verifyEmail(token: string): Promise<void> {
  const userId = await redis.get(`${EMAIL_VERIFY_PREFIX}${token}`);
  if (!userId) throw new AppError(400, 'Invalid or expired verification token');
  await prisma.user.update({ where: { id: userId }, data: { emailVerified: true } });
  await redis.del(`${EMAIL_VERIFY_PREFIX}${token}`);
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // silent — don't reveal if email exists
  const token = crypto.randomBytes(32).toString('hex');
  await redis.setex(`${PASSWORD_RESET_PREFIX}${token}`, 3600, user.id);
  const resetUrl = `${env.APP_URL}/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Reset your password — LeaderAssess Pro',
    html: resetPasswordTemplate(user.name, resetUrl),
    text: `Reset your password: ${resetUrl}`,
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const userId = await redis.get(`${PASSWORD_RESET_PREFIX}${token}`);
  if (!userId) throw new AppError(400, 'Invalid or expired reset token');
  const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  await redis.del(`${PASSWORD_RESET_PREFIX}${token}`);
}

export async function inviteUser(
  inviterName: string,
  toEmail: string,
  role: UserRole
): Promise<void> {
  const token = crypto.randomBytes(32).toString('hex');
  const payload = JSON.stringify({ email: toEmail, role });
  await redis.setex(`${INVITE_PREFIX}${token}`, 7 * 24 * 3600, payload);
  const inviteUrl = `${env.APP_URL}/accept-invite?token=${token}`;
  await sendEmail({
    to: toEmail,
    subject: `You've been invited to LeaderAssess Pro`,
    html: inviteUserTemplate(inviterName, inviteUrl, role),
    text: `Accept your invitation: ${inviteUrl}`,
  });
}

export async function acceptInvite(token: string, name: string, password: string): Promise<AuthTokens> {
  const raw = await redis.get(`${INVITE_PREFIX}${token}`);
  if (!raw) throw new AppError(400, 'Invalid or expired invitation');
  const { email, role } = JSON.parse(raw) as { email: string; role: UserRole };
  await redis.del(`${INVITE_PREFIX}${token}`);
  return register({ email, name, password, role });
}

export async function login(dto: LoginDto, ip?: string, ua?: string): Promise<AuthTokens> {
  const user = await prisma.user.findUnique({ where: { email: dto.email } });
  if (!user || !user.isActive) throw new AppError(401, 'Invalid email or password');

  const valid = await bcrypt.compare(dto.password, user.passwordHash);
  if (!valid) throw new AppError(401, 'Invalid email or password');

  await prisma.user.update({
    where: { id: user.id },
    data:  { lastLoginAt: new Date() },
  });

  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    sub:   user.id,
    email: user.email,
    role:  user.role as UserRole,
  };
  const tokens = generateTokens(payload);
  await storeRefreshToken(user.id, tokens.refreshToken);

  void logAudit(user.id, 'login', 'users', user.id, {}, ip, ua);

  return {
    ...tokens,
    user: { id: user.id, email: user.email, name: user.name, role: user.role as UserRole },
  };
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  let payload: JwtPayload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, 'Invalid refresh token');
  }

  const stored = await redis.get(`${REFRESH_PREFIX}${payload.sub}`);
  if (stored !== refreshToken) throw new AppError(401, 'Refresh token has been revoked');

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) throw new AppError(401, 'User not found or inactive');

  const newPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
    sub:   user.id,
    email: user.email,
    role:  user.role as UserRole,
  };
  const tokens = generateTokens(newPayload);
  await storeRefreshToken(user.id, tokens.refreshToken);

  return {
    ...tokens,
    user: { id: user.id, email: user.email, name: user.name, role: user.role as UserRole },
  };
}

export async function logout(userId: string, accessToken: string): Promise<void> {
  // Revoke access token in Redis (TTL = JWT exp ~7d)
  await redis.setex(`revoked:${accessToken}`, 7 * 24 * 3600, '1');
  // Remove refresh token
  await redis.del(`${REFRESH_PREFIX}${userId}`);
  void logAudit(userId, 'logout', 'users', userId);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'User not found');

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new AppError(400, 'Current password is incorrect');

  const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

async function storeRefreshToken(userId: string, token: string): Promise<void> {
  // 30 days TTL
  await redis.setex(`${REFRESH_PREFIX}${userId}`, 30 * 24 * 3600, token);
}
