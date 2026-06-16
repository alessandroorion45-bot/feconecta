import { useState, useEffect, useCallback, useRef } from "react";
import { 
  profileCache, 
  deduplicateRequest, 
  retryWithBackoff,
  CircuitBreaker 
} from "@/lib/performance";

interface UseOptimizedQueryOptions<T> {
  cacheKey?: string;
  cacheTTL?: number;
  enabled?: boolean;
  retry?: boolean;
  maxRetries?: number;
  onError?: (error: Error) => void;
  fallbackData?: T;
}

interface UseOptimizedQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isFromCache: boolean;
}

// Circuit breaker for database queries
const queryCircuitBreaker = new CircuitBreaker(5, 30000);

/**
 * Optimized query hook with caching, deduplication, and resilience
 */
export function useOptimizedQuery<T>(
  queryFn: () => Promise<T>,
  options: UseOptimizedQueryOptions<T> = {}
): UseOptimizedQueryResult<T> {
  const {
    cacheKey,
    cacheTTL = 300,
    enabled = true,
    retry = true,
    maxRetries = 3,
    onError,
    fallbackData,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  
  const mountedRef = useRef(true);

  const executeQuery = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    // Check cache first
    if (cacheKey) {
      const cached = profileCache.get(cacheKey);
      if (cached) {
        setData(cached);
        setIsFromCache(true);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);
    setIsFromCache(false);

    try {
      const result = await queryCircuitBreaker.execute(
        async () => {
          // Deduplicate identical requests
          const requestKey = cacheKey || queryFn.toString();
          
          return deduplicateRequest(requestKey, async () => {
            if (retry) {
              return retryWithBackoff(queryFn, maxRetries);
            }
            return queryFn();
          });
        },
        fallbackData ? () => fallbackData : undefined
      );

      if (mountedRef.current) {
        setData(result);
        
        // Cache the result
        if (cacheKey) {
          profileCache.set(cacheKey, result, cacheTTL);
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        const error = err as Error;
        setError(error);
        onError?.(error);
        
        // Use fallback data if available
        if (fallbackData) {
          setData(fallbackData);
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [queryFn, cacheKey, cacheTTL, enabled, retry, maxRetries, onError, fallbackData]);

  useEffect(() => {
    mountedRef.current = true;
    executeQuery();
    
    return () => {
      mountedRef.current = false;
    };
  }, [executeQuery]);

  const refetch = useCallback(async () => {
    // Clear cache before refetching
    if (cacheKey) {
      profileCache.delete(cacheKey);
    }
    await executeQuery();
  }, [cacheKey, executeQuery]);

  return {
    data,
    loading,
    error,
    refetch,
    isFromCache,
  };
}

/**
 * Hook for paginated queries with optimized loading
 */
export function usePaginatedQuery<T>(
  queryFn: (page: number, pageSize: number) => Promise<{ data: T[]; hasMore: boolean }>,
  options: {
    pageSize?: number;
    cacheKeyPrefix?: string;
  } = {}
) {
  const { pageSize = 20, cacheKeyPrefix } = options;
  
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadPage = useCallback(async (pageNum: number, append: boolean = false) => {
    const cacheKey = cacheKeyPrefix ? `${cacheKeyPrefix}_page_${pageNum}` : undefined;
    
    // Check cache
    if (cacheKey) {
      const cached = profileCache.get(cacheKey);
      if (cached) {
        if (append) {
          setItems(prev => [...prev, ...cached.data]);
        } else {
          setItems(cached.data);
        }
        setHasMore(cached.hasMore);
        return;
      }
    }

    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const result = await queryFn(pageNum, pageSize);
      
      if (append) {
        setItems(prev => [...prev, ...result.data]);
      } else {
        setItems(result.data);
      }
      setHasMore(result.hasMore);
      
      // Cache the result
      if (cacheKey) {
        profileCache.set(cacheKey, result, 120);
      }
    } catch (error) {
      console.error("Pagination error:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [queryFn, pageSize, cacheKeyPrefix]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadPage(nextPage, true);
  }, [hasMore, loadingMore, page, loadPage]);

  const refresh = useCallback(() => {
    setPage(0);
    setItems([]);
    loadPage(0, false);
  }, [loadPage]);

  useEffect(() => {
    loadPage(0, false);
  }, []);

  return {
    items,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    refresh,
  };
}

export default useOptimizedQuery;
