import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * In-memory cache for SWR pattern
 * Structure: { key: { data, timestamp } }
 */
const swrCache = new Map();

/**
 * Default cache configuration
 */
const DEFAULT_CONFIG = {
  dedupingInterval: 2000, // 2 seconds - prevents duplicate requests
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  focusThrottleInterval: 5000,
};

/**
 * Get cached data for a key
 * @param {string} key - Cache key
 * @returns {any|null} Cached data or null
 */
export const getCachedData = (key) => {
  const cached = swrCache.get(key);
  return cached?.data || null;
};

/**
 * Set cached data for a key
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 */
export const setCachedData = (key, data) => {
  swrCache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

/**
 * Clear cached data for a key
 * @param {string} key - Cache key
 */
export const clearCachedData = (key) => {
  swrCache.delete(key);
};

/**
 * Clear all cached data
 */
export const clearAllCache = () => {
  swrCache.clear();
};

/**
 * Get cache timestamp for a key
 * @param {string} key - Cache key
 * @returns {number|null} Timestamp or null
 */
export const getCacheTimestamp = (key) => {
  const cached = swrCache.get(key);
  return cached?.timestamp || null;
};

/**
 * In-flight request tracker to prevent duplicate requests
 */
const inFlightRequests = new Map();

/**
 * Custom hook implementing Stale-While-Revalidate (SWR) pattern
 *
 * @param {string} key - Unique cache key
 * @param {Function} fetcher - Async function to fetch data
 * @param {Object} config - Configuration options
 * @returns {Object} - { data, error, isLoading, isRevalidating, mutate, revalidate }
 *
 * @example
 * const { data, isLoading, isRevalidating } = useSWR(
 *   'student-dashboard',
 *   () => fetchDashboardData(),
 *   { revalidateOnFocus: true }
 * );
 */
export const useSWR = (key, fetcher, config = {}) => {
  const options = { ...DEFAULT_CONFIG, ...config };

  // Get initial cached data
  const cachedData = getCachedData(key);

  const [data, setData] = useState(cachedData);
  const [error, setError] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Track if this is the initial load (no cached data)
  const isInitialLoad = !cachedData;
  const isLoading = isInitialLoad && isValidating;
  const isRevalidating = !isInitialLoad && isValidating;

  // Refs for cleanup and tracking
  const mountedRef = useRef(true);
  const lastFocusRevalidateRef = useRef(0);
  const revalidateTimeoutRef = useRef(null);

  /**
   * Main fetch function with deduplication and error handling
   */
  const fetchData = useCallback(async (shouldSetValidating = true) => {
    if (!key || !fetcher) return;

    // Check if there's already an in-flight request for this key
    const existingRequest = inFlightRequests.get(key);
    if (existingRequest) {
      // Wait for existing request to complete
      try {
        const result = await existingRequest;
        if (mountedRef.current) {
          setData(result);
        }
        return result;
      } catch (err) {
        if (mountedRef.current) {
          setError(err);
        }
        throw err;
      }
    }

    if (shouldSetValidating && mountedRef.current) {
      setIsValidating(true);
    }

    // Create new request promise
    const requestPromise = (async () => {
      try {
        const freshData = await fetcher();

        if (mountedRef.current) {
          setData(freshData);
          setError(null);
          setRetryCount(0);

          // Update cache
          setCachedData(key, freshData);
        }

        return freshData;
      } catch (err) {
        if (mountedRef.current) {
          setError(err);

          // Retry logic
          if (
            options.shouldRetryOnError &&
            retryCount < options.errorRetryCount
          ) {
            setRetryCount((prev) => prev + 1);

            // Schedule retry
            revalidateTimeoutRef.current = setTimeout(() => {
              fetchData(false);
            }, options.errorRetryInterval);
          }
        }

        throw err;
      } finally {
        if (mountedRef.current) {
          setIsValidating(false);
        }

        // Remove from in-flight requests
        inFlightRequests.delete(key);
      }
    })();

    // Track in-flight request
    inFlightRequests.set(key, requestPromise);

    return requestPromise;
  }, [key, fetcher, options.shouldRetryOnError, options.errorRetryCount, options.errorRetryInterval, retryCount]);

  /**
   * Manual revalidation function
   */
  const revalidate = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  /**
   * Mutate function - allows optimistic updates
   */
  const mutate = useCallback((newData, shouldRevalidate = true) => {
    if (typeof newData === 'function') {
      setData((currentData) => {
        const updated = newData(currentData);
        setCachedData(key, updated);
        return updated;
      });
    } else {
      setData(newData);
      setCachedData(key, newData);
    }

    if (shouldRevalidate) {
      revalidate();
    }
  }, [key, revalidate]);

  /**
   * Initial fetch and cache hydration
   */
  useEffect(() => {
    // If we have cached data, show it immediately
    const cached = getCachedData(key);
    if (cached && !data) {
      setData(cached);
    }

    // Always fetch fresh data in the background
    fetchData(true);
  }, [key]); // Only re-run if key changes

  /**
   * Revalidate on window focus
   */
  useEffect(() => {
    if (!options.revalidateOnFocus) return;

    const handleFocus = () => {
      const now = Date.now();
      // Throttle focus revalidation
      if (now - lastFocusRevalidateRef.current > options.focusThrottleInterval) {
        lastFocusRevalidateRef.current = now;
        fetchData(false);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [options.revalidateOnFocus, options.focusThrottleInterval, fetchData]);

  /**
   * Revalidate on network reconnect
   */
  useEffect(() => {
    if (!options.revalidateOnReconnect) return;

    const handleOnline = () => {
      fetchData(false);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [options.revalidateOnReconnect, fetchData]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (revalidateTimeoutRef.current) {
        clearTimeout(revalidateTimeoutRef.current);
      }
    };
  }, []);

  return {
    data,
    error,
    isLoading, // True only on initial load with no cache
    isRevalidating, // True when fetching fresh data with cached data already displayed
    mutate,
    revalidate,
  };
};

/**
 * Hook for conditional SWR fetching
 * Only fetches when condition is met
 */
export const useSWRConditional = (key, fetcher, shouldFetch, config = {}) => {
  const result = useSWR(
    shouldFetch ? key : null,
    fetcher,
    config
  );

  return result;
};

export default useSWR;
