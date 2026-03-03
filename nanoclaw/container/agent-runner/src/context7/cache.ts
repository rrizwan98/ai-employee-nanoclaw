/**
 * Context7 Cache Module
 *
 * In-memory cache for Context7 responses with 30-minute TTL.
 * Reduces API calls for repeated queries within same session.
 */

import { CacheEntry, CacheStats } from './types.js';

/**
 * Default TTL for cache entries (30 minutes)
 */
const DEFAULT_TTL_MS = 30 * 60 * 1000;

/**
 * In-memory cache for Context7 responses
 */
export class Context7Cache {
  private cache: Map<string, CacheEntry> = new Map();
  private hits: number = 0;
  private misses: number = 0;
  private readonly ttlMs: number;

  constructor(ttlMs: number = DEFAULT_TTL_MS) {
    this.ttlMs = ttlMs;
  }

  /**
   * Generate a consistent cache key from library ID and query
   */
  getCacheKey(libraryId: string, query: string): string {
    // Normalize the key to handle minor query variations
    const normalizedQuery = query.toLowerCase().trim();
    return `${libraryId}::${normalizedQuery}`;
  }

  /**
   * Get a cached entry if it exists and hasn't expired
   */
  get(libraryId: string, query: string): CacheEntry | null {
    const key = this.getCacheKey(libraryId, query);
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry;
  }

  /**
   * Store a response in the cache
   */
  set(libraryId: string, query: string, response: string): void {
    const key = this.getCacheKey(libraryId, query);
    const now = Date.now();

    this.cache.set(key, {
      libraryId,
      query,
      response,
      timestamp: now,
      expiresAt: now + this.ttlMs,
    });
  }

  /**
   * Check if a cache entry exists (without affecting hit/miss stats)
   */
  has(libraryId: string, query: string): boolean {
    const key = this.getCacheKey(libraryId, query);
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Remove a specific entry from the cache
   */
  delete(libraryId: string, query: string): boolean {
    const key = this.getCacheKey(libraryId, query);
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from the cache
   */
  invalidate(): void {
    this.cache.clear();
    // Don't reset stats - keep them for session-level tracking
  }

  /**
   * Remove all expired entries from the cache
   */
  prune(): number {
    const now = Date.now();
    let pruned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        pruned++;
      }
    }

    return pruned;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      entries: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total) * 100 : 0,
    };
  }

  /**
   * Reset hit/miss statistics
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get all cached entries (for debugging)
   */
  getAllEntries(): CacheEntry[] {
    return Array.from(this.cache.values());
  }

  /**
   * Get the TTL for this cache instance
   */
  getTtlMs(): number {
    return this.ttlMs;
  }
}

// Singleton instance for global use
let globalCache: Context7Cache | null = null;

/**
 * Get the global Context7 cache instance
 */
export function getContext7Cache(): Context7Cache {
  if (!globalCache) {
    globalCache = new Context7Cache();
  }
  return globalCache;
}

/**
 * Reset the global cache (for testing)
 */
export function resetGlobalCache(): void {
  if (globalCache) {
    globalCache.invalidate();
    globalCache.resetStats();
  }
  globalCache = null;
}
