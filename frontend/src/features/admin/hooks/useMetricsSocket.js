import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { message } from 'antd';

/**
 * Custom hook for real-time system metrics via WebSocket
 * Provides health and metrics data with automatic updates
 * Uses the shared useWebSocket hook for unified WebSocket connection
 */
export const useMetricsSocket = (options = {}) => {
  const { autoConnect = true, fallbackToPolling = true } = options;

  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [sessionStats, setSessionStats] = useState(null);
  const [backupProgress, setBackupProgress] = useState(null);
  const [bulkOperationProgress, setBulkOperationProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Use shared WebSocket connection
  const { isConnected, connectionError, on, off, emit } = useWebSocket();

  const pollingInterval = useRef(null);
  const mounted = useRef(true);

  // Fallback polling function
  const fetchMetricsHttp = useCallback(async () => {
    try {
      const { adminService } = await import('../../../services/admin.service');
      const [healthData, metricsData] = await Promise.all([
        adminService.getDetailedHealth(),
        adminService.getRealtimeMetrics(),
      ]);

      if (mounted.current) {
        setHealth(healthData);
        setMetrics(metricsData);
        setLastUpdate(new Date());
        setLoading(false);
        setError(null);
      }
    } catch (err) {
      if (mounted.current) {
        setError(err.message);
        setLoading(false);
      }
    }
  }, []);

  // Start HTTP polling fallback
  const startPolling = useCallback(() => {
    if (pollingInterval.current) return;

    console.log('[useMetricsSocket] Starting HTTP polling fallback');
    fetchMetricsHttp(); // Initial fetch
    pollingInterval.current = setInterval(fetchMetricsHttp, 15000);
  }, [fetchMetricsHttp]);

  // Stop HTTP polling
  const stopPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  }, []);

  // Manual refresh via WebSocket
  const refresh = useCallback(() => {
    if (isConnected) {
      emit('refreshMetrics');
    } else {
      fetchMetricsHttp();
    }
  }, [isConnected, emit, fetchMetricsHttp]);

  // Refresh sessions via WebSocket
  const refreshSessions = useCallback(() => {
    if (isConnected) {
      emit('refreshSessions');
    }
  }, [isConnected, emit]);

  // Handle connection state changes
  useEffect(() => {
    if (isConnected) {
      stopPolling();
      setLoading(false);
    } else if (fallbackToPolling && autoConnect) {
      startPolling();
    }
  }, [isConnected, fallbackToPolling, autoConnect, startPolling, stopPolling]);

  // Handle connection errors
  useEffect(() => {
    if (connectionError) {
      setError(connectionError);
      if (fallbackToPolling) {
        message.info('Using HTTP polling for metrics updates');
        startPolling();
      }
    }
  }, [connectionError, fallbackToPolling, startPolling]);

  // Setup WebSocket event listeners
  useEffect(() => {
    mounted.current = true;

    if (!isConnected) return;

    // Handler for metrics updates
    const handleMetricsUpdate = (data) => {
      if (mounted.current) {
        setHealth(data.health);
        setMetrics(data.metrics);
        setLastUpdate(new Date(data.timestamp));
        setLoading(false);
        setError(null);
      }
    };

    // Handler for quick metrics (CPU/Memory only)
    const handleQuickMetrics = (data) => {
      if (mounted.current) {
        setMetrics((prev) => ({
          ...prev,
          cpu: { ...prev?.cpu, usage: data.cpu },
          memory: { ...prev?.memory, usagePercent: data.memory },
          application: { ...prev?.application, uptime: data.uptime },
        }));
        setLastUpdate(new Date(data.timestamp));
      }
    };

    // Handler for service alerts
    const handleServiceAlert = (data) => {
      if (mounted.current) {
        const alertType = data.status === 'down' ? 'error' : 'success';
        message[alertType](`${data.service} is ${data.status.toUpperCase()}`);

        // Update health with new service status
        setHealth((prev) => {
          if (!prev) return prev;
          const serviceKey = data.service.toLowerCase();
          if (prev.services && prev.services[serviceKey]) {
            return {
              ...prev,
              services: {
                ...prev.services,
                [serviceKey]: {
                  ...prev.services[serviceKey],
                  status: data.status,
                },
              },
            };
          }
          return prev;
        });
      }
    };

    // Handler for session updates
    const handleSessionUpdate = (data) => {
      if (mounted.current) {
        setSessionStats(data.stats);
        if (data.action === 'terminated') {
          message.info('Session activity updated');
        }
      }
    };

    // Handler for backup progress
    const handleBackupProgress = (data) => {
      if (mounted.current) {
        setBackupProgress(data);
        if (data.status === 'completed') {
          message.success('Backup completed successfully');
        } else if (data.status === 'failed') {
          message.error(`Backup failed: ${data.message || 'Unknown error'}`);
        }
      }
    };

    // Handler for bulk operation progress
    const handleBulkOperationProgress = (data) => {
      if (mounted.current) {
        setBulkOperationProgress(data);
        if (data.completed === data.total) {
          message.success(`Bulk ${data.type} operation completed: ${data.completed}/${data.total}`);
        }
      }
    };

    // Handler for initial data (sent when admin connects)
    const handleInitialData = (data) => {
      if (mounted.current) {
        setHealth(data.health);
        setMetrics(data.metrics);
        setLastUpdate(new Date());
        setLoading(false);
      }
    };

    // Handler for errors
    const handleError = (err) => {
      if (mounted.current) {
        setError(err.message || 'WebSocket error');
      }
    };

    // Subscribe to events
    on('metricsUpdate', handleMetricsUpdate);
    on('quickMetrics', handleQuickMetrics);
    on('serviceAlert', handleServiceAlert);
    on('sessionUpdate', handleSessionUpdate);
    on('backupProgress', handleBackupProgress);
    on('bulkOperationProgress', handleBulkOperationProgress);
    on('initialData', handleInitialData);
    on('error', handleError);

    // Cleanup
    return () => {
      mounted.current = false;
      off('metricsUpdate', handleMetricsUpdate);
      off('quickMetrics', handleQuickMetrics);
      off('serviceAlert', handleServiceAlert);
      off('sessionUpdate', handleSessionUpdate);
      off('backupProgress', handleBackupProgress);
      off('bulkOperationProgress', handleBulkOperationProgress);
      off('initialData', handleInitialData);
      off('error', handleError);
      stopPolling();
    };
  }, [isConnected, on, off, stopPolling]);

  // Initial data fetch if using polling
  useEffect(() => {
    if (autoConnect && !isConnected && fallbackToPolling) {
      fetchMetricsHttp();
    }
  }, [autoConnect, isConnected, fallbackToPolling, fetchMetricsHttp]);

  return {
    health,
    metrics,
    sessionStats,
    backupProgress,
    bulkOperationProgress,
    connected: isConnected,
    loading,
    error,
    lastUpdate,
    refresh,
    refreshSessions,
  };
};

export default useMetricsSocket;
