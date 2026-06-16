// Performance utilities for high-traffic scenarios

/**
 * In-memory cache with TTL support for frequently accessed data
 */
class MemoryCache<T> {
  private cache = new Map<string, { value: T; expiresAt: number }>();
  private defaultTTL: number;

  constructor(defaultTTLSeconds: number = 300) {
    this.defaultTTL = defaultTTLSeconds * 1000;
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  set(key: string, value: T, ttlSeconds?: number): void {
    const ttl = (ttlSeconds ?? this.defaultTTL / 1000) * 1000;
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instances for different data types
export const profileCache = new MemoryCache<any>(300); // 5 minutes
export const friendsCache = new MemoryCache<any>(120); // 2 minutes
export const notificationsCache = new MemoryCache<any>(60); // 1 minute

/**
 * Debounce function for reducing API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function for rate limiting
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Request deduplication to prevent duplicate API calls
 */
const pendingRequests = new Map<string, Promise<any>>();

export async function deduplicateRequest<T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> {
  const pending = pendingRequests.get(key);
  if (pending) {
    return pending as Promise<T>;
  }

  const promise = requestFn().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
}

/**
 * Retry with exponential backoff for resilience
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Batch multiple requests to reduce API calls
 */
export class RequestBatcher<K, V> {
  private batch: K[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private resolver: ((values: Map<K, V>) => void) | null = null;
  private promise: Promise<Map<K, V>> | null = null;

  constructor(
    private batchFn: (keys: K[]) => Promise<Map<K, V>>,
    private maxBatchSize: number = 100,
    private batchDelayMs: number = 10
  ) {}

  async get(key: K): Promise<V | undefined> {
    this.batch.push(key);

    if (!this.promise) {
      this.promise = new Promise(resolve => {
        this.resolver = resolve;
      });
    }

    if (this.batch.length >= this.maxBatchSize) {
      this.executeBatch();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.executeBatch(), this.batchDelayMs);
    }

    const results = await this.promise;
    return results?.get(key);
  }

  private async executeBatch() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const currentBatch = [...this.batch];
    const currentResolver = this.resolver;
    
    this.batch = [];
    this.promise = null;
    this.resolver = null;

    try {
      const results = await this.batchFn(currentBatch);
      currentResolver?.(results);
    } catch (error) {
      currentResolver?.(new Map());
    }
  }
}

/**
 * Circuit breaker for graceful degradation
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime: number | null = null;
  private isOpen = false;

  constructor(
    private threshold: number = 5,
    private resetTimeoutMs: number = 30000
  ) {}

  async execute<T>(fn: () => Promise<T>, fallback?: () => T): Promise<T> {
    if (this.isOpen) {
      if (Date.now() - (this.lastFailureTime ?? 0) > this.resetTimeoutMs) {
        this.isOpen = false;
        this.failures = 0;
      } else if (fallback) {
        return fallback();
      } else {
        throw new Error("Circuit breaker is open");
      }
    }

    try {
      const result = await fn();
      this.failures = 0;
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      
      if (this.failures >= this.threshold) {
        this.isOpen = true;
      }
      
      if (fallback) {
        return fallback();
      }
      throw error;
    }
  }

  getState(): "closed" | "open" | "half-open" {
    if (!this.isOpen) return "closed";
    if (Date.now() - (this.lastFailureTime ?? 0) > this.resetTimeoutMs) return "half-open";
    return "open";
  }
}

/**
 * Lazy image loading with intersection observer
 */
export function createImageObserver(
  onVisible: (element: Element) => void
): IntersectionObserver | null {
  if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
    return null;
  }

  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          onVisible(entry.target);
        }
      });
    },
    {
      rootMargin: "50px 0px",
      threshold: 0.01,
    }
  );
}

/**
 * Prefetch data for anticipated navigation
 */
export function prefetchData(
  key: string,
  fetchFn: () => Promise<any>,
  cache: MemoryCache<any>
): void {
  // Only prefetch if not already cached
  if (cache.get(key)) return;

  // Use requestIdleCallback for non-blocking prefetch
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(() => {
      fetchFn().then((data) => cache.set(key, data));
    });
  } else {
    setTimeout(() => {
      fetchFn().then((data) => cache.set(key, data));
    }, 100);
  }
}

// Cleanup cached data periodically
if (typeof window !== "undefined") {
  setInterval(() => {
    profileCache.cleanup();
    friendsCache.cleanup();
    notificationsCache.cleanup();
  }, 60000); // Every minute
}
