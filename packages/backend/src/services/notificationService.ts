import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends SocketServer {
  userId?: string;
}

interface NotificationPayload {
  type: 'GENERATION_COMPLETE' | 'GENERATION_FAILED' | 'QUALITY_ALERT' | 'SYSTEM_MESSAGE';
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'medium' | 'high';
}

class NotificationService {
  private io: SocketServer | null = null;
  private userSockets: Map<string, Set<string>> = new Map();

  initialize(httpServer: HttpServer) {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
      },
      path: '/socket.io',
    });

    this.io.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
          userId: string;
        };
        socket.userId = decoded.userId;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket: any) => {
      const userId = socket.userId;
      console.log(`✅ User ${userId} connected to WebSocket`);

      // Track user socket connections
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);

      // Join user's personal room
      socket.join(`user:${userId}`);

      socket.on('disconnect', () => {
        console.log(`❌ User ${userId} disconnected from WebSocket`);
        const sockets = this.userSockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            this.userSockets.delete(userId);
          }
        }
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });

    console.log('✅ WebSocket server initialized');
  }

  /**
   * Send notification to a specific user
   */
  sendToUser(userId: string, notification: NotificationPayload) {
    if (!this.io) {
      console.warn('WebSocket server not initialized');
      return;
    }

    this.io.to(`user:${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString(),
    });

    console.log(`📤 Notification sent to user ${userId}:`, notification.type);
  }

  /**
   * Send generation complete notification
   */
  notifyGenerationComplete(userId: string, data: {
    sessionId: string;
    assetId: string;
    consistencyScore?: number;
    thumbnailUrl?: string;
  }) {
    this.sendToUser(userId, {
      type: 'GENERATION_COMPLETE',
      title: 'Generation Complete',
      message: 'Your photo generation is ready!',
      data,
      priority: 'high',
    });
  }

  /**
   * Send generation failed notification
   */
  notifyGenerationFailed(userId: string, data: {
    sessionId: string;
    error: string;
  }) {
    this.sendToUser(userId, {
      type: 'GENERATION_FAILED',
      title: 'Generation Failed',
      message: `Generation failed: ${data.error}`,
      data,
      priority: 'high',
    });
  }

  /**
   * Send quality alert notification
   */
  notifyQualityAlert(userId: string, data: {
    sessionId: string;
    assetId: string;
    score: number;
    issues: string[];
  }) {
    this.sendToUser(userId, {
      type: 'QUALITY_ALERT',
      title: 'Quality Alert',
      message: `Generation completed with quality score: ${data.score.toFixed(1)}`,
      data,
      priority: data.score < 70 ? 'high' : 'medium',
    });
  }

  /**
   * Send system message
   */
  sendSystemMessage(userId: string, message: string) {
    this.sendToUser(userId, {
      type: 'SYSTEM_MESSAGE',
      title: 'System Message',
      message,
      priority: 'low',
    });
  }

  /**
   * Broadcast to all connected users
   */
  broadcast(notification: NotificationPayload) {
    if (!this.io) {
      console.warn('WebSocket server not initialized');
      return;
    }

    this.io.emit('notification', {
      ...notification,
      timestamp: new Date().toISOString(),
    });

    console.log(`📢 Broadcast notification:`, notification.type);
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  /**
   * Get Socket.IO instance
   */
  getIO(): SocketServer | null {
    return this.io;
  }
}

export const notificationService = new NotificationService();
