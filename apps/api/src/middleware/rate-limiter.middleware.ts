import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
}

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  private requests = new Map<string, number[]>();
  private readonly defaultConfig: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests, please try again later',
  };

  use(req: Request, res: Response, next: NextFunction) {
    const key = this.getKeyForRequest(req);
    const now = Date.now();

    // Get request timestamps for this key
    let timestamps = this.requests.get(key) || [];

    // Remove old timestamps outside the window
    timestamps = timestamps.filter(
      (timestamp) => now - timestamp < this.defaultConfig.windowMs,
    );

    // Check if limit exceeded
    if (timestamps.length >= this.defaultConfig.maxRequests) {
      throw new HttpException(
        this.defaultConfig.message,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Add current timestamp
    timestamps.push(now);
    this.requests.set(key, timestamps);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', this.defaultConfig.maxRequests);
    res.setHeader('X-RateLimit-Remaining', this.defaultConfig.maxRequests - timestamps.length);
    res.setHeader(
      'X-RateLimit-Reset',
      new Date(now + this.defaultConfig.windowMs).toISOString(),
    );

    next();
  }

  private getKeyForRequest(req: Request): string {
    // Use tenant ID + user ID if available, otherwise IP
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = (req as any).user?.uid;
    const ip = req.ip;

    if (tenantId && userId) {
      return `${tenantId}:${userId}`;
    }

    return ip || 'unknown';
  }
}
