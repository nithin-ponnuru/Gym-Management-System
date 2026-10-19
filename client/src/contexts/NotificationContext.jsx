/**
 * NotificationContext.jsx
 * 
 * Provides:
 *  - Real-time notifications via Socket.IO
 *  - Unread count badge
 *  - Fetch/read/clear operations
 *  - HTTP fallback polling every 60 seconds (in case socket is disconnected)
 */

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../services/api';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);

  const authToken = token || localStorage.getItem('gym_token');
  const isAdmin = user?.role === 'admin';

  // ── Fetch from REST API ───────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!isAdmin || !authToken) return;
    try {
      setLoading(true);
      const res = await api.get('/notifications', {
        params: { limit: 50 },
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.warn('[Notifications] Fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, authToken]);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAdmin || !authToken) return;
    try {
      const res = await api.get('/notifications/unread-count', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setUnreadCount(res.data.data?.count || 0);
    } catch (_) {}
  }, [isAdmin, authToken]);

  // ── Mark single as read ───────────────────────────────────────────────────
  const markRead = useCallback(async (id) => {
    try {
      const res = await api.put(`/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(res.data.unreadCount ?? 0);
    } catch (err) {
      console.warn('[Notifications] markRead error:', err.message);
    }
  }, [authToken]);

  // ── Mark all as read ──────────────────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    try {
      await api.put('/notifications/mark-all-read', {}, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('[Notifications] markAllRead error:', err.message);
    }
  }, [authToken]);

  // ── Delete single ─────────────────────────────────────────────────────────
  const deleteNotification = useCallback(async (id) => {
    try {
      await api.delete(`/notifications/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setNotifications(prev => {
        const removed = prev.find(n => n._id === id);
        if (removed && !removed.isRead) setUnreadCount(c => Math.max(0, c - 1));
        return prev.filter(n => n._id !== id);
      });
    } catch (err) {
      console.warn('[Notifications] delete error:', err.message);
    }
  }, [authToken]);

  // ── Clear all read ────────────────────────────────────────────────────────
  const clearReadNotifications = useCallback(async () => {
    try {
      await api.delete('/notifications/clear-read', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setNotifications(prev => prev.filter(n => !n.isRead));
    } catch (err) {
      console.warn('[Notifications] clearRead error:', err.message);
    }
  }, [authToken]);

  // ── Socket.IO Real-time ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAdmin || !authToken) return;

    // Initial fetch
    fetchNotifications();

    // Connect socket — use origin so it goes through Vite proxy in dev
    const socketUrl = import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin;
    const socket = io(socketUrl, {
      auth: { token: authToken },
      transports: ['websocket', 'polling'],
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Admin connected for notifications');
    });

    socket.on('notification:new', (notification) => {
      console.log('[Socket] New notification received:', notification.title);
      setNotifications(prev => {
        // Prevent duplicate socket push
        if (prev.some(n => n._id === notification._id)) return prev;
        return [notification, ...prev].slice(0, 100);
      });
      setUnreadCount(prev => prev + 1);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    // Fallback: poll every 30 seconds in case socket reconnect fails
    const pollInterval = setInterval(fetchUnreadCount, 30000);

    return () => {
      socket.disconnect();
      clearInterval(pollInterval);
      socketRef.current = null;
    };
  }, [isAdmin, authToken]);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markRead,
    markAllRead,
    deleteNotification,
    clearReadNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
};
