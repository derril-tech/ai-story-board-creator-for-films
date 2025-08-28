import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import Redis from 'redis';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Skip rate limiting for successful requests
  skipFailedRequests?: boolean; // Skip rate limiting for failed requests
}

@Injectable()
export class RateLimiterService {
  private redis: Redis.RedisClient;

  constructor() {
    this.redis = Redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
    });
  }

  async checkRateLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get current requests in window
    const requests = await this.getRequestsInWindow(key, windowStart);

    // Remove expired requests
    const validRequests = requests.filter(timestamp => timestamp > windowStart);

    // Check if limit exceeded
    const remaining = Math.max(0, config.maxRequests - validRequests.length);
    const allowed = remaining > 0;

    if (allowed) {
      // Add current request
      validRequests.push(now);
      await this.setRequestsInWindow(key, validRequests, config.windowMs);
    }

    return {
      allowed,
      remaining,
      resetTime: now + config.windowMs,
    };
  }

  private async getRequestsInWindow(key: string, windowStart: number): Promise<number[]> {
    return new Promise((resolve, reject) => {
      this.redis.zrangebyscore(key, windowStart, '+inf', (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.map(Number));
        }
      });
    });
  }

  private async setRequestsInWindow(key: string, requests: number[], ttl: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const pipeline = this.redis.pipeline();
      
      // Remove old entries
      pipeline.zremrangebyscore(key, '-inf', Date.now() - ttl);
      
      // Add new entries
      requests.forEach(timestamp => {
        pipeline.zadd(key, timestamp, timestamp.toString());
      });
      
      // Set expiry
      pipeline.expire(key, Math.ceil(ttl / 1000));
      
      pipeline.exec((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  generateKey(req: Request, config: RateLimitConfig): string {
    if (config.keyGenerator) {
      return config.keyGenerator(req);
    }

    // Default key generation based on IP and user ID
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userId = (req.user as any)?.id || 'anonymous';
    const path = req.path;

    return `rate_limit:${ip}:${userId}:${path}`;
  }

  async resetRateLimit(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.redis.del(key, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}
