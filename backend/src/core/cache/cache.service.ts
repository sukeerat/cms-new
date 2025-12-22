import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { LruCacheService } from './lru-cache.service';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private cacheUnavailableSince: number | null = null;
  private cacheLastErrorLogAt: number | null = null;
  private cacheDisabledUntil = 0;
  private readonly cacheErrorDelayMs = 5 * 60 * 1000;
  private readonly cacheCooldownMs = 5 * 60 * 1000;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private lruCacheService: LruCacheService,
  ) {}

  async get<T>(key: string): Promise<T | undefined> {
    if (this.isCacheManagerUsable()) {
      try {
        return await this.cacheManager.get<T>(key);
      } catch (error) {
        this.handleCacheManagerError(error);
      }
    }
    const fallback = await this.lruCacheService.get<T>(key);
    return fallback === null ? undefined : fallback;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (this.isCacheManagerUsable()) {
      try {
        await this.cacheManager.set(key, value, ttl);
        return;
      } catch (error) {
        this.handleCacheManagerError(error);
      }
    }
    await this.lruCacheService.set(key, value, {
      ttl: this.toMs(ttl),
    });
  }

  async del(key: string): Promise<void> {
    if (this.isCacheManagerUsable()) {
      try {
        await this.cacheManager.del(key);
        return;
      } catch (error) {
        this.handleCacheManagerError(error);
      }
    }
    await this.lruCacheService.delete(key);
  }

  async clear(): Promise<void> {
    if (this.isCacheManagerUsable()) {
      const store = (this.cacheManager as any)?.store;
      if (store && typeof store.reset === 'function') {
        try {
          await store.reset();
          return;
        } catch (error) {
          this.handleCacheManagerError(error);
        }
      }
    }

    await this.lruCacheService.clear();
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== undefined && cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl);

    return value;
  }

  async wrap<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    if (this.isCacheManagerUsable()) {
      try {
        return await this.cacheManager.wrap(key, fn, ttl);
      } catch (error) {
        this.handleCacheManagerError(error);
      }
    }
    return this.lruCacheService.getOrSet(key, fn, { ttl: this.toMs(ttl) });
  }

  async mget<T>(...keys: string[]): Promise<(T | undefined)[]> {
    return Promise.all(keys.map((key) => this.get<T>(key)));
  }

  async mset(entries: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
    await Promise.all(entries.map((entry) => this.set(entry.key, entry.value, entry.ttl)));
  }

  async mdel(...keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.del(key)));
  }

  private toMs(ttlSeconds?: number): number | undefined {
    if (ttlSeconds === undefined || ttlSeconds === null) {
      return undefined;
    }
    const parsed = Number(ttlSeconds);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return undefined;
    }
    return Math.round(parsed * 1000);
  }

  private isCacheManagerUsable(): boolean {
    return Date.now() >= this.cacheDisabledUntil;
  }

  private handleCacheManagerError(error: unknown): void {
    const now = Date.now();
    if (this.cacheUnavailableSince === null) {
      this.cacheUnavailableSince = now;
    }
    this.cacheDisabledUntil = Math.max(this.cacheDisabledUntil, now + this.cacheCooldownMs);

    const unavailableForMs = now - this.cacheUnavailableSince;
    const shouldLog =
      unavailableForMs >= this.cacheErrorDelayMs &&
      (this.cacheLastErrorLogAt === null ||
        now - this.cacheLastErrorLogAt >= this.cacheErrorDelayMs);

    if (shouldLog) {
      this.cacheLastErrorLogAt = now;
      this.logger.error(
        'Cache manager unavailable for 5 minutes; using local cache fallback',
        error as Error,
      );
    }
  }
}
