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
  user_id?: string;
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
  private readonly connectedUsers = new Map<string, string>(); // user_id -> socketId

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

      client.user_id = payload.sub;
      this.connectedUsers.set(client.user_id, client.id);

      // Join room cho user để có thể gửi notification đến user cụ thể
      await client.join(`user:${client.user_id}`);

      this.logger.log(`User connected: ${client.user_id} (socket: ${client.id})`);
      this.logger.log(`Total connected users: ${this.connectedUsers.size}`);

      // Emit connection status
      this.server.to(`user:${client.user_id}`).emit('connected', {
        user_id: client.user_id,
        socketId: client.id,
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.user_id) {
      this.connectedUsers.delete(client.user_id);
      this.logger.log(`User disconnected: ${client.user_id}`);
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
    if (!client.user_id) {
      return { error: 'Unauthorized' };
    }

    this.logger.log(`Message from ${client.user_id} to ${data.receiverId}`);

    // Emit message đến receiver
    this.server.to(`user:${data.receiverId}`).emit('new_message', {
      senderId: client.user_id,
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
    @MessageBody() data: { user_id: string; notification: any },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user_id) {
      return { error: 'Unauthorized' };
    }

    this.logger.log(`Notification to ${data.user_id} from ${client.user_id}`);

    // Emit notification đến user
    this.server.to(`user:${data.user_id}`).emit('new_notification', data.notification);

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
    if (!client.user_id) {
      return { error: 'Unauthorized' };
    }

    this.server.to(`user:${data.receiverId}`).emit('user_typing', {
      user_id: client.user_id,
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
    if (!client.user_id) {
      return { error: 'Unauthorized' };
    }

    await client.join(`room:${data.roomId}`);
    this.logger.log(`User ${client.user_id} joined room ${data.roomId}`);

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
    if (!client.user_id) {
      return { error: 'Unauthorized' };
    }

    await client.leave(`room:${data.roomId}`);
    this.logger.log(`User ${client.user_id} left room ${data.roomId}`);

    return { success: true, roomId: data.roomId };
  }

  /**
   * Public method để emit notification từ service
   */
  emitNotification(user_id: string, notification: any) {
    this.server.to(`user:${user_id}`).emit('new_notification', notification);
  }

  /**
   * Public method để emit message đến conversation room
   * @param conversationId - Conversation ID (not user ID)
   * @param message - Message data
   */
  emitMessage(conversationId: string, message: any) {
    // Emit đến conversation room (clients subscribe to room:${conversationId})
    this.server.to(`room:${conversationId}`).emit('new_message', message);
  }

  /**
   * Public method để emit message đến user (for direct notifications)
   * @param user_id - User ID
   * @param message - Message data
   */
  emitMessageToUser(user_id: string, message: any) {
    // Emit đến user room (clients subscribe to user:${user_id})
    this.server.to(`user:${user_id}`).emit('new_message', message);
  }

  /**
   * Public method để emit live update (post, like, comment)
   */
  emitLiveUpdate(user_id: string, update: any) {
    this.server.to(`user:${user_id}`).emit('live_update', update);
  }

  /**
   * Public method để emit typing indicator
   */
  emitTyping(conversationId: string, data: { user_id: string; isTyping: boolean }) {
    this.server.to(`room:${conversationId}`).emit('user_typing', data);
  }

  /**
   * Public method để emit message read receipt
   */
  emitMessageRead(
    conversationId: string,
    data: { messageId: string; user_id: string; readAt: Date },
  ) {
    this.server.to(`room:${conversationId}`).emit('message_read', data);
  }

  /**
   * Public method để emit user status update
   */
  emitUserStatus(user_id: string, status: { isOnline: boolean; lastSeen?: Date }) {
    this.server.to(`user:${user_id}`).emit('user_status', { user_id, ...status });
  }

  /**
   * Check if user is online
   */
  isUserOnline(user_id: string): boolean {
    return this.connectedUsers.has(user_id);
  }

  /**
   * Get online users count
   */
  getOnlineUsersCount(): number {
    return this.connectedUsers.size;
  }
}
