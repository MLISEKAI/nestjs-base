import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WSGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/',
})
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);
  private readonly connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Authenticate user từ token
      const token = this.extractTokenFromSocket(client);
      if (!token) {
        this.logger.warn(`Connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      client.userId = payload.sub;
      this.connectedUsers.set(client.userId, client.id);

      // Join room cho user để có thể gửi notification đến user cụ thể
      await client.join(`user:${client.userId}`);

      this.logger.log(`User connected: ${client.userId} (socket: ${client.id})`);
      this.logger.log(`Total connected users: ${this.connectedUsers.size}`);

      // Emit connection status
      this.server.to(`user:${client.userId}`).emit('connected', {
        userId: client.userId,
        socketId: client.id,
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      this.logger.log(`User disconnected: ${client.userId}`);
      this.logger.log(`Total connected users: ${this.connectedUsers.size}`);
    }
  }

  /**
   * Extract JWT token từ socket handshake
   */
  private extractTokenFromSocket(client: Socket): string | null {
    // Try từ auth token
    const authToken = client.handshake.auth?.token;
    if (authToken) {
      return authToken;
    }

    // Try từ query parameter
    const queryToken = client.handshake.query?.token;
    if (queryToken && typeof queryToken === 'string') {
      return queryToken;
    }

    // Try từ Authorization header
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  /**
   * Send message event
   */
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: { receiverId: string; content: string; messageId?: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    this.logger.log(`Message from ${client.userId} to ${data.receiverId}`);

    // Emit message đến receiver
    this.server.to(`user:${data.receiverId}`).emit('new_message', {
      senderId: client.userId,
      receiverId: data.receiverId,
      content: data.content,
      messageId: data.messageId,
      timestamp: new Date(),
    });

    // Confirm to sender
    return {
      success: true,
      messageId: data.messageId,
    };
  }

  /**
   * Send notification event
   */
  @SubscribeMessage('send_notification')
  async handleSendNotification(
    @MessageBody() data: { userId: string; notification: any },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    this.logger.log(`Notification to ${data.userId} from ${client.userId}`);

    // Emit notification đến user
    this.server.to(`user:${data.userId}`).emit('new_notification', data.notification);

    return { success: true };
  }

  /**
   * Typing indicator
   */
  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { receiverId: string; isTyping: boolean },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    this.server.to(`user:${data.receiverId}`).emit('user_typing', {
      userId: client.userId,
      isTyping: data.isTyping,
    });

    return { success: true };
  }

  /**
   * Join room (for group chat, etc.)
   */
  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    await client.join(`room:${data.roomId}`);
    this.logger.log(`User ${client.userId} joined room ${data.roomId}`);

    return { success: true, roomId: data.roomId };
  }

  /**
   * Leave room
   */
  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    await client.leave(`room:${data.roomId}`);
    this.logger.log(`User ${client.userId} left room ${data.roomId}`);

    return { success: true, roomId: data.roomId };
  }

  /**
   * Public method để emit notification từ service
   */
  emitNotification(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('new_notification', notification);
  }

  /**
   * Public method để emit message từ service
   */
  emitMessage(receiverId: string, message: any) {
    this.server.to(`user:${receiverId}`).emit('new_message', message);
  }

  /**
   * Public method để emit live update (post, like, comment)
   */
  emitLiveUpdate(userId: string, update: any) {
    this.server.to(`user:${userId}`).emit('live_update', update);
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get online users count
   */
  getOnlineUsersCount(): number {
    return this.connectedUsers.size;
  }
}
