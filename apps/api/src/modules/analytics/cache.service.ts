import { Injectable } from '@nestjs/common';
import * as redis from 'redis';

@Injectable()
export class CacheService {
  private client: redis.RedisClientType | null = null;

  async onModuleInit() {
    if (process.env.REDIS_URL) {
      this.client = redis.createClient({
        url: process.env.REDIS_URL,
      });
      await this.client.connect();
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.disconnect();
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(
    key: string,
    value: string,
    expirationSeconds?: number,
  ): Promise<void> {
    if (!this.client) return;
    try {
      if (expirationSeconds) {
        await this.client.setEx(key, expirationSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  async clear(pattern: string): Promise<void> {
    if (!this.client) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error(`Cache clear error for pattern ${pattern}:`, error);
    }
  }
}
