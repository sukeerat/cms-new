import { useEffect, useRef } from 'react';

/**
 * Hook to manage AbortController for API requests
 * Automatically cleans up on component unmount
 * @returns {Object} Object with getSignal and abort methods
 */
export const useAbortController = () => {
  const controllerRef = useRef(null);

  useEffect(() => {
    // Create controller on mount
    controllerRef.current = new AbortController();

    // Cleanup on unmount
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  return {
    /**
     * Get the abort signal for API requests
     * @returns {AbortSignal}
     */
    getSignal: () => controllerRef.current?.signal,

    /**
     * Manually abort the request
     */
    abort: () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    },

    /**
     * Create a new controller (useful when you need multiple requests)
     * @returns {AbortSignal}
     */
    createNew: () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      controllerRef.current = new AbortController();
      return controllerRef.current.signal;
    },
  };
};

/**
 * Hook to manage multiple AbortControllers
 * @returns {Object} Object with methods to manage multiple abort controllers
 */
export const useAbortControllers = () => {
  const controllersRef = useRef(new Map());

  useEffect(() => {
    // Cleanup all controllers on unmount
    return () => {
      controllersRef.current.forEach((controller) => controller.abort());
      controllersRef.current.clear();
    };
  }, []);

  return {
    /**
     * Get or create a signal for a specific key
     * @param {string} key - Unique identifier for the request
     * @returns {AbortSignal}
     */
    getSignal: (key) => {
      if (!controllersRef.current.has(key)) {
        controllersRef.current.set(key, new AbortController());
      }
      return controllersRef.current.get(key).signal;
    },

    /**
     * Create a new controller for a specific key
     * Aborts any existing controller with the same key
     * @param {string} key - Unique identifier for the request
     * @returns {AbortSignal}
     */
    createNew: (key) => {
      // Abort existing controller if present
      if (controllersRef.current.has(key)) {
        controllersRef.current.get(key).abort();
      }

      const controller = new AbortController();
      controllersRef.current.set(key, controller);
      return controller.signal;
    },

    /**
     * Abort a specific request
     * @param {string} key - The key of the request to abort
     */
    abort: (key) => {
      const controller = controllersRef.current.get(key);
      if (controller) {
        controller.abort();
        controllersRef.current.delete(key);
      }
    },

    /**
     * Abort all requests
     */
    abortAll: () => {
      controllersRef.current.forEach((controller) => controller.abort());
      controllersRef.current.clear();
    },

    /**
     * Clean up a specific controller after request completes
     * @param {string} key - The key of the completed request
     */
    cleanup: (key) => {
      controllersRef.current.delete(key);
    },
  };
};

export default useAbortController;
