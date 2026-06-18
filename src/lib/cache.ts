/**
 * Sistema de Cache em Memória
 * Reduz chamadas ao banco de dados
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Armazena item no cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt
    });

    console.log(`📦 Cache SET: ${key} (TTL: ${ttl || this.defaultTTL}ms)`);
  }

  /**
   * Recupera item do cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      console.log(`❌ Cache MISS: ${key}`);
      return null;
    }

    const now = Date.now();

    // Verificar se expirou
    if (now > entry.expiresAt) {
      console.log(`⏰ Cache EXPIRED: ${key}`);
      this.cache.delete(key);
      return null;
    }

    console.log(`✅ Cache HIT: ${key}`);
    return entry.data as T;
  }

  /**
   * Remove item do cache
   */
  delete(key: string): void {
    this.cache.delete(key);
    console.log(`🗑️ Cache DELETE: ${key}`);
  }

  /**
   * Remove itens que começam com prefixo
   */
  deleteByPrefix(prefix: string): void {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    console.log(`🗑️ Cache DELETE BY PREFIX: ${prefix} (${count} items)`);
  }

  /**
   * Limpa cache expirado
   */
  cleanup(): void {
    const now = Date.now();
    let count = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0) {
      console.log(`🧹 Cache CLEANUP: ${count} items removidos`);
    }
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🗑️ Cache CLEAR: ${size} items removidos`);
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());

    return {
      total: entries.length,
      expired: entries.filter(([, e]) => now > e.expiresAt).length,
      active: entries.filter(([, e]) => now <= e.expiresAt).length,
      oldestTimestamp: Math.min(...entries.map(([, e]) => e.timestamp)),
      newestTimestamp: Math.max(...entries.map(([, e]) => e.timestamp))
    };
  }

  /**
   * Wrapper: buscar do cache ou executar função
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Tentar pegar do cache
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Não está no cache, buscar
    console.log(`🔍 Cache FETCH: ${key}`);
    const data = await fetchFn();

    // Armazenar no cache
    this.set(key, data, ttl);

    return data;
  }
}

// Singleton
export const cache = new CacheManager();

// Cleanup automático a cada 5 minutos
if (typeof window !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * TTLs recomendados por tipo de dado
 */
export const CacheTTL = {
  PROFILE: 10 * 60 * 1000,      // 10 minutos
  FEED: 2 * 60 * 1000,          // 2 minutos
  FRIENDS: 5 * 60 * 1000,       // 5 minutos
  SETTINGS: 30 * 60 * 1000,     // 30 minutos
  STATIC: 60 * 60 * 1000,       // 1 hora
  SEARCH: 1 * 60 * 1000,        // 1 minuto
};

/**
 * Chaves de cache padronizadas
 */
export const CacheKeys = {
  profile: (userId: string) => `profile:${userId}`,
  feed: (userId: string, page: number) => `feed:${userId}:${page}`,
  friends: (userId: string) => `friends:${userId}`,
  settings: (userId: string) => `settings:${userId}`,
  photos: (userId: string) => `photos:${userId}`,
  videos: (userId: string) => `videos:${userId}`,
};
