import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { TokenService } from '../../core/auth/services/token.service';
import { NotificationPayload, UnreadCountPayload, MarkAsReadPayload } from './dto/notification.dto';

@WebSocketGateway({
  cors: {
    origin: '*', // Configure based on your frontend URL in production
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(private readonly tokenService: TokenService) {}

  /**
   * Handle new WebSocket connection
   * Validates JWT token and joins user to their room
   */
  async handleConnection(client: Socket): Promise<void> {
    try {
      // Extract token from handshake query or auth header
      const token = this.extractToken(client);

      if (!token) {
        this.logger.warn(`Connection rejected: No token provided - ${client.id}`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      // Validate JWT token on EVERY connection (including reconnects)
      const payload = this.tokenService.validateAccessToken(token);

      if (!payload || !payload.sub) {
        this.logger.warn(`Connection rejected: Invalid token - ${client.id}`);
        client.emit('error', { message: 'Invalid token' });
        client.disconnect();
        return;
      }

      const userId = payload.sub;

      // Store user data in socket
      client.data.userId = userId;
      client.data.email = payload.email;

      // Join user-specific room
      await client.join(`user:${userId}`);

      // Track socket for this user
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      this.logger.log(`Client connected: ${client.id} (User: ${userId})`);

      // Emit connection success
      client.emit('connected', { userId, message: 'Connected to notifications' });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`, error.stack);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  /**
   * Handle WebSocket disconnection
   */
  handleDisconnect(client: Socket): void {
    const userId = client.data?.userId;

    if (userId) {
      // Remove socket from tracking
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(client.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(userId);
        }
      }
    }

    this.logger.log(`Client disconnected: ${client.id} (User: ${userId || 'unknown'})`);
  }

  /**
   * Handle mark as read event from client
   */
  @SubscribeMessage('markAsRead')
  handleMarkAsRead(
    @MessageBody() data: MarkAsReadPayload,
    @ConnectedSocket() client: Socket,
  ): void {
    const userId = client.data?.userId;
    if (!userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    this.logger.debug(`User ${userId} marking notification ${data.notificationId} as read`);
    // The actual marking is done via HTTP API, this is just for acknowledgment
    client.emit('markAsReadAck', { notificationId: data.notificationId });
  }

  /**
   * Emit notification to a specific user
   * Called by NotificationService when a new notification is created
   */
  emitToUser(userId: string, event: string, data: NotificationPayload | UnreadCountPayload): void {
    this.server.to(`user:${userId}`).emit(event, data);
    this.logger.debug(`Emitted '${event}' to user ${userId}`);
  }

  /**
   * Emit notification to multiple users
   */
  emitToUsers(userIds: string[], event: string, data: NotificationPayload | UnreadCountPayload): void {
    userIds.forEach((userId) => {
      this.emitToUser(userId, event, data);
    });
  }

  /**
   * Emit to all connected clients (broadcast)
   */
  broadcast(event: string, data: any): void {
    this.server.emit(event, data);
    this.logger.debug(`Broadcast '${event}' to all clients`);
  }

  /**
   * Check if a user is currently connected
   */
  isUserConnected(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return sockets !== undefined && sockets.size > 0;
  }

  /**
   * Get count of connected users
   */
  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Extract JWT token from socket handshake
   */
  private extractToken(client: Socket): string | null {
    // Try query parameter first (for browser compatibility)
    const queryToken = client.handshake.query.token;
    if (queryToken && typeof queryToken === 'string') {
      return queryToken;
    }

    // Try auth object
    const authToken = client.handshake.auth?.token;
    if (authToken && typeof authToken === 'string') {
      return authToken;
    }

    // Try Authorization header
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }
}
