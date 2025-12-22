import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Redlock from 'redlock';
import Redis from 'ioredis';

@Injectable()
export class RedlockService implements OnModuleInit {
  private readonly logger = new Logger(RedlockService.name);
  private redlock: Redlock;
  private redis: Redis;
  private redisUnavailableSince: number | null = null;
  private redisLastErrorLogAt: number | null = null;
  private readonly redisErrorDelayMs = 5 * 60 * 1000;

  async onModuleInit() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    });

    this.redis.on('ready', () => {
      this.redisUnavailableSince = null;
      this.redisLastErrorLogAt = null;
    });

    this.redlock = new Redlock([this.redis], {
      driftFactor: 0.01,
      retryCount: 10,
      retryDelay: 200,
      retryJitter: 200,
      automaticExtensionThreshold: 500,
    });

    this.redlock.on('error', (error) => {
      this.handleRedlockError(error);
    });
  }

  async acquireLock(resource: string, ttl: number = 5000) {
    try {
      return await this.redlock.acquire([`lock:${resource}`], ttl);
    } catch (error) {
      this.logger.warn(`Failed to acquire lock for ${resource}`);
      throw error;
    }
  }

  async withLock<T>(
    resource: string,
    operation: () => Promise<T>,
    ttl: number = 5000,
  ): Promise<T> {
    const lock = await this.acquireLock(resource, ttl);
    try {
      return await operation();
    } finally {
      await lock.release();
    }
  }

  private handleRedlockError(error: unknown): void {
    const now = Date.now();

    if (this.redisUnavailableSince === null) {
      this.redisUnavailableSince = now;
    }

    const unavailableForMs = now - this.redisUnavailableSince;
    const shouldLog =
      unavailableForMs >= this.redisErrorDelayMs &&
      (this.redisLastErrorLogAt === null ||
        now - this.redisLastErrorLogAt >= this.redisErrorDelayMs);

    if (shouldLog) {
      this.redisLastErrorLogAt = now;
      this.logger.error('Redis lock unavailable for 5 minutes', error as Error);
    }
  }
}
