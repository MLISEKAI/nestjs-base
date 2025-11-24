// Import Module decorator từ NestJS
import { Module } from '@nestjs/common';
// Import JwtModule để xác thực JWT trong WebSocket
import { JwtModule } from '@nestjs/jwt';
// Import ConfigModule để đọc environment variables
import { ConfigModule } from '@nestjs/config';
// Import WebSocketGateway để xử lý real-time communication
import { WebSocketGateway } from './gateway/websocket.gateway';

/**
 * @Module() - Đánh dấu class này là NestJS module
 * RealtimeModule - Module xử lý real-time features (WebSocket)
 *
 * Chức năng chính:
 * - WebSocket communication (real-time messaging, notifications)
 * - Real-time updates cho posts, comments, likes
 * - Push notifications qua WebSocket
 *
 * Dependencies:
 * - JwtModule: JWT authentication cho WebSocket connections
 * - ConfigModule: Environment variables
 *
 * Exports:
 * - WebSocketGateway: Để các modules khác sử dụng (ví dụ: NotificationsModule để emit notifications)
 */
@Module({
  imports: [JwtModule, ConfigModule],
  providers: [WebSocketGateway],
  exports: [WebSocketGateway],
})
export class RealtimeModule {}
