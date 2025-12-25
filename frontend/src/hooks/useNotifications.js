import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { apiClient } from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import toast from 'react-hot-toast';
import { useWebSocket } from './useWebSocket';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Get auth token from Redux store
  const { token } = useSelector((state) => state.auth);

  // Use the shared WebSocket hook
  const { isConnected, on, off, emit } = useWebSocket();

  // Fetch notifications via HTTP (initial load and fallback)
  const fetchNotifications = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS);
      setNotifications(response.data || []);
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Set up WebSocket event listeners
  useEffect(() => {
    if (!isConnected) return;

    // Handler for new notifications
    const handleNotification = (notification) => {
      console.log('New notification received:', notification);
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show toast for new notification
      toast(notification.title, {
        icon: 'info',
        duration: 4000,
      });
    };

    // Handler for unread count updates
    const handleUnreadCount = (data) => {
      setUnreadCount(data.count);
    };

    // Handler for mark as read acknowledgment
    const handleMarkAsReadAck = (data) => {
      console.log('Mark as read acknowledged:', data.notificationId);
    };

    // Handler for connection success - fetch initial notifications
    const handleConnected = () => {
      fetchNotifications();
    };

    // Subscribe to events
    on('notification', handleNotification);
    on('unreadCount', handleUnreadCount);
    on('markAsReadAck', handleMarkAsReadAck);
    on('connected', handleConnected);

    // Cleanup on unmount
    return () => {
      off('notification', handleNotification);
      off('unreadCount', handleUnreadCount);
      off('markAsReadAck', handleMarkAsReadAck);
      off('connected', handleConnected);
    };
  }, [isConnected, on, off, fetchNotifications]);

  // Fetch notifications when token changes
  useEffect(() => {
    if (token) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [token, fetchNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await apiClient.put(`${API_ENDPOINTS.NOTIFICATIONS}/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Also notify via WebSocket for acknowledgment
      emit('markAsRead', { notificationId });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [emit]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await apiClient.put(`${API_ENDPOINTS.NOTIFICATIONS}/read-all`);
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark notifications as read');
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await apiClient.delete(`${API_ENDPOINTS.NOTIFICATIONS}/${notificationId}`);
      setNotifications((prev) =>
        prev.filter((notif) => notif.id !== notificationId)
      );
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  }, []);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    try {
      const response = await apiClient.delete(`${API_ENDPOINTS.NOTIFICATIONS}/clear-all`);
      setNotifications([]);
      setUnreadCount(0);
      toast.success(response.message || 'All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    isConnected,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };
};

export default useNotifications;
