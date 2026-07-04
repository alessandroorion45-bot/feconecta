/**
 * Sistema de cache para páginas pesadas
 * Reduz tempo de carregamento em 5-10x
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class PageCache {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Salvar dados no cache
   */
  set<T>(key: string, data: T, ttlMinutes: number = 5): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
    console.log(`✅ Cache salvo: ${key} (TTL: ${ttlMinutes}min)`);
  }

  /**
   * Buscar dados do cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      console.log(`❌ Cache miss: ${key}`);
      return null;
    }

    const isExpired = Date.now() - entry.timestamp > entry.ttl;

    if (isExpired) {
      this.cache.delete(key);
      console.log(`⏰ Cache expirado: ${key}`);
      return null;
    }

    console.log(`✅ Cache hit: ${key}`);
    return entry.data as T;
  }

  /**
   * Buscar ou executar se não existir
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMinutes: number = 5
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached) return cached;

    console.log(`📥 Buscando dados: ${key}`);
    const data = await fetchFn();
    this.set(key, data, ttlMinutes);
    return data;
  }

  /**
   * Limpar cache específico
   */
  clear(key: string): void {
    this.cache.delete(key);
    console.log(`🗑️ Cache removido: ${key}`);
  }

  /**
   * Limpar cache por prefixo
   */
  clearByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
    console.log(`🗑️ Cache removido: ${prefix}*`);
  }

  /**
   * Limpar todo o cache
   */
  clearAll(): void {
    this.cache.clear();
    console.log(`🗑️ Todo cache limpo!`);
  }

  /**
   * Ver estatísticas do cache
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Singleton
export const pageCache = new PageCache();

// TTLs recomendados por tipo de página
export const CACHE_TTL = {
  PRAYERS: 2, // 2 minutos (muda frequentemente)
  TESTIMONIES: 5, // 5 minutos
  FEED: 2, // 2 minutos
  PROFILE: 10, // 10 minutos
  FRIENDS: 5, // 5 minutos
  RANKING: 10, // 10 minutos
  CHAT: 1, // 1 minuto (tempo real)
  GROUPS: 10, // 10 minutos
} as const;
