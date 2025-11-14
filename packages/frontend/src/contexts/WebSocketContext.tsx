import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

interface Notification {
  type: 'GENERATION_COMPLETE' | 'GENERATION_FAILED' | 'QUALITY_ALERT' | 'SYSTEM_MESSAGE';
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'medium' | 'high';
  timestamp: string;
}

interface WebSocketContextType {
  socket: Socket | null;
  connected: boolean;
  notifications: Notification[];
  markNotificationRead: (index: number) => void;
  clearAllNotifications: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const WS_URL = API_URL.replace('/api', '').replace('http', 'ws');

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) {
      // Disconnect if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    // Connect to WebSocket server
    const newSocket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnected(false);
    });

    newSocket.on('notification', (notification: Notification) => {
      console.log('📬 Notification received:', notification);

      // Add to notifications list
      setNotifications((prev) => [notification, ...prev].slice(0, 50)); // Keep last 50

      // Show toast notification
      const toastOptions = {
        duration: notification.priority === 'high' ? 6000 : 4000,
        position: 'top-right' as const,
      };

      switch (notification.type) {
        case 'GENERATION_COMPLETE':
          toast.success(notification.message, toastOptions);
          break;
        case 'GENERATION_FAILED':
          toast.error(notification.message, toastOptions);
          break;
        case 'QUALITY_ALERT':
          toast(notification.message, {
            ...toastOptions,
            icon: '⚠️',
          });
          break;
        case 'SYSTEM_MESSAGE':
          toast(notification.message, toastOptions);
          break;
      }
    });

    newSocket.on('pong', () => {
      // Connection health check response
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, [user]);

  // Ping every 30 seconds to keep connection alive
  useEffect(() => {
    if (!socket || !connected) return;

    const pingInterval = setInterval(() => {
      socket.emit('ping');
    }, 30000);

    return () => clearInterval(pingInterval);
  }, [socket, connected]);

  const markNotificationRead = useCallback((index: number) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = {
    socket,
    connected,
    notifications,
    markNotificationRead,
    clearAllNotifications,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
