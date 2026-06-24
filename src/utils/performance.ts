/**
 * Utilitários de Performance - Motor de Impulso Vercel
 * Otimizações para evitar travamentos e melhorar velocidade
 */

/**
 * Debounce otimizado para inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle para scroll events
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Lazy load de imagens com IntersectionObserver
 */
export const lazyLoadImage = (imgElement: HTMLImageElement) => {
  const src = imgElement.dataset.src;
  if (!src) return;

  const observer = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    },
    {
      rootMargin: '50px',
    }
  );

  observer.observe(imgElement);
};

/**
 * Preload de recursos críticos
 */
export const preloadResource = (href: string, as: string) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = href;
  document.head.appendChild(link);
};

/**
 * Cache de requisições com TTL
 */
class RequestCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl: number;

  constructor(ttlMinutes: number = 5) {
    this.ttl = ttlMinutes * 60 * 1000;
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

export const requestCache = new RequestCache(5);

/**
 * Batch de atualizações React (evitar múltiplos re-renders)
 */
export const batchUpdate = <T extends (...args: any[]) => void>(
  callback: T
): ((...args: Parameters<T>) => void) => {
  let pending = false;
  let args: Parameters<T> | null = null;

  return (...newArgs: Parameters<T>) => {
    args = newArgs;
    if (!pending) {
      pending = true;
      requestAnimationFrame(() => {
        if (args) {
          callback(...args);
        }
        pending = false;
        args = null;
      });
    }
  };
};

/**
 * Virtual scroll helper (para listas grandes)
 */
export const calculateVisibleRange = (
  scrollTop: number,
  itemHeight: number,
  containerHeight: number,
  totalItems: number,
  overscan: number = 3
): { start: number; end: number } => {
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const end = Math.min(totalItems, start + visibleCount + overscan * 2);

  return { start, end };
};

/**
 * Idle callback wrapper (executar em tempo ocioso)
 */
export const runWhenIdle = (callback: () => void, timeout: number = 2000) => {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 1);
  }
};

/**
 * Memoização simples para funções puras
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Pré-carregar próxima página (prefetch)
 */
export const prefetchRoute = (path: string) => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = path;
  document.head.appendChild(link);
};

/**
 * Detectar conexão lenta
 */
export const isSlowConnection = (): boolean => {
  const connection = (navigator as any).connection;
  if (!connection) return false;

  return (
    connection.saveData ||
    connection.effectiveType === 'slow-2g' ||
    connection.effectiveType === '2g' ||
    connection.effectiveType === '3g'
  );
};

/**
 * Otimizar carregamento de fontes
 */
export const optimizeFontLoading = () => {
  if ('fonts' in document) {
    Promise.all([
      (document as any).fonts.load('1em Inter'),
      (document as any).fonts.load('bold 1em Inter'),
    ]).then(() => {
      document.documentElement.classList.add('fonts-loaded');
    });
  }
};
