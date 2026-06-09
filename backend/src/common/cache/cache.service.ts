import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PinoLoggerService } from '../logger/pino-logger.service';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly defaultTTL = 300; // 5 minutes

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLoggerService,
  ) {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    this.redis = new Redis(redisUrl);
    
    this.redis.on('error', (err) => {
      this.logger.error('Redis connection error:', err.message, 'CacheService');
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis connected', 'CacheService');
    });
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      this.logger.warn(`Cache get error for key ${key}: ${(error as Error).message}`, 'CacheService');
      return null;
    }
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        await this.redis.setex(key, this.defaultTTL, serialized);
      }
    } catch (error) {
      this.logger.warn(`Cache set error for key ${key}: ${(error as Error).message}`, 'CacheService');
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.warn(`Cache delete error for key ${key}: ${(error as Error).message}`, 'CacheService');
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys: string[] = [];
      const stream = this.redis.scanStream({
        match: pattern,
        count: 100,
      });
      for await (const result of stream) {
        keys.push(...result);
      }
      if (keys.length > 0) {
        for (let i = 0; i < keys.length; i += 100) {
          await this.redis.del(...keys.slice(i, i + 100));
        }
      }
    } catch (error) {
      this.logger.warn(`Cache delete pattern error for ${pattern}: ${(error as Error).message}`, 'CacheService');
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      return (await this.redis.exists(key)) === 1;
    } catch (error) {
      this.logger.warn(`Cache exists error for key ${key}: ${(error as Error).message}`, 'CacheService');
      return false;
    }
  }

  generateKey(prefix: string, ...params: (string | number | undefined)[]): string {
    return `${prefix}:${params.filter(Boolean).join(':')}`;
  }
}
