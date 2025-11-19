import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { NotificationType, NotificationStatus } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({ example: 'user-id-123', description: 'ID người nhận notification' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ example: 'sender-id-456', description: 'ID người gửi (null nếu system)' })
  @IsOptional()
  @IsUUID()
  senderId?: string;

  @ApiProperty({ enum: NotificationType, example: NotificationType.MESSAGE })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ example: 'New Message', description: 'Tiêu đề notification' })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'You have a new message from John',
    description: 'Nội dung notification',
  })
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: '{"messageId": "msg-123"}', description: 'JSON data bổ sung' })
  @IsOptional()
  @IsString()
  data?: string;

  @ApiPropertyOptional({ example: '/messages/123', description: 'Link đến nội dung liên quan' })
  @IsOptional()
  @IsString()
  link?: string;
}

export class UpdateNotificationStatusDto {
  @ApiProperty({ enum: NotificationStatus, example: NotificationStatus.READ })
  @IsEnum(NotificationStatus)
  status: NotificationStatus;
}

export class NotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  senderId?: string;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty({ enum: NotificationStatus })
  status: NotificationStatus;

  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiPropertyOptional()
  data?: string;

  @ApiPropertyOptional()
  link?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
