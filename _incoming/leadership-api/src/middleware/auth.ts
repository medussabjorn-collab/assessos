import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { redis } from '../config/database';
import { AuthRequest, JwtPayload, UserRole } from '../types';
import { unauthorized, forbidden } from '../utils/response';

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    unauthorized(res, 'No token provided');
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    unauthorized(res, 'Invalid or expired token');
  }
}

export function authenticateOptional(req: AuthRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.slice(7), env.JWT_SECRET) as JwtPayload;
    } catch {
      // silently ignore
    }
  }
  next();
}

export function authorize(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      unauthorized(res);
      return;
    }
    if (!roles.includes(req.user.role)) {
      forbidden(res, `Role '${req.user.role}' is not allowed to access this resource`);
      return;
    }
    next();
  };
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    forbidden(res, 'Admin access required');
    return;
  }
  next();
}

// Check if token has been revoked (stored in Redis on logout)
export async function checkTokenRevocation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) { next(); return; }

  const token = header.slice(7);
  const revoked = await redis.get(`revoked:${token}`);
  if (revoked) {
    unauthorized(res, 'Token has been revoked');
    return;
  }
  next();
}

export function generateTokens(payload: Omit<JwtPayload, 'iat' | 'exp'>): {
  accessToken: string;
  refreshToken: string;
} {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
  return { accessToken, refreshToken };
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
}
