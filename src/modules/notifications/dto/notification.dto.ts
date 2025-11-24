// Import decorators từ Swagger để tạo API documentation
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// Import decorators từ class-validator để validate dữ liệu
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
// Import decorators từ class-transformer để transform dữ liệu
import { Type } from 'class-transformer';
// Import enums từ Prisma
import { NotificationType, NotificationStatus } from '@prisma/client';
// Import BaseQueryDto để extend pagination
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

/**
 * CreateNotificationDto - DTO để tạo notification mới
 *
 * Lưu ý:
 * - user_id: Bắt buộc, ID người nhận notification (receiver_id)
 * - sender_id: Optional, tự động lấy từ JWT token (user đang authenticated)
 * - type: Bắt buộc, loại notification (MESSAGE, LIKE, COMMENT, etc.)
 * - title: Bắt buộc, tiêu đề notification
 * - content: Bắt buộc, nội dung notification
 * - data: Optional, JSON data bổ sung (stringified JSON)
 * - link: Optional, link đến nội dung liên quan
 */
export class CreateNotificationDto {
  @ApiProperty({
    example: 'user-b-id',
    description:
      'ID người nhận notification (receiver_id) - User sẽ nhận được thông báo này.\n\nVí dụ: User A (đang đăng nhập) like post của User B → user_id = User B (người nhận thông báo "User A liked your post").\n\nBắt buộc phải có vì server cần biết gửi notification cho ai.',
  })
  @IsUUID()
  user_id: string;

  // sender_id sẽ tự động lấy từ JWT token (user đang authenticated)
  sender_id?: string;

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

/**
 * UpdateNotificationStatusDto - DTO để update notification status
 *
 * Lưu ý:
 * - status: Bắt buộc, status mới (READ hoặc UNREAD)
 * - Dùng để đánh dấu notification là đã đọc hoặc chưa đọc
 */
export class UpdateNotificationStatusDto {
  @ApiProperty({ enum: NotificationStatus, example: NotificationStatus.READ })
  @IsEnum(NotificationStatus)
  status: NotificationStatus;
}

/**
 * Custom validator để validate comma-separated NotificationType values
 * Mỗi giá trị trong chuỗi comma-separated phải là một NotificationType enum member hợp lệ
 */
function IsCommaSeparatedEnum(
  enumObject: object,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isCommaSeparatedEnum',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [enumObject],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value || typeof value !== 'string') {
            return true; // Let @IsOptional handle empty values
          }
          // Tách chuỗi bằng dấu phẩy và validate từng giá trị
          const values = value.split(',').map((v: string) => v.trim());
          const enumValues = Object.values(args.constraints[0]);
          // Tất cả các giá trị phải là enum member hợp lệ
          return values.every((v: string) => enumValues.includes(v));
        },
        defaultMessage(args: ValidationArguments) {
          const enumValues = Object.values(args.constraints[0]).join(', ');
          return `Each value in ${args.property} must be one of: ${enumValues}`;
        },
      },
    });
  };
}

/**
 * NotificationQueryDto - DTO cho query parameters của GET /notifications
 * Extends BaseQueryDto với type và status filters
 *
 * Chức năng:
 * - Pagination (page, limit)
 * - Search và sorting (từ BaseQueryDto)
 * - Filter theo notification type (có thể truyền nhiều types comma-separated)
 * - Filter theo status (READ hoặc UNREAD)
 */
export class NotificationQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({
    description: 'Filter theo notification type. Có thể truyền nhiều types (comma-separated)',
    example: 'LIKE,COMMENT',
    enum: NotificationType,
  })
  @IsOptional()
  @IsString()
  @IsCommaSeparatedEnum(NotificationType, {
    message: 'Each notification type must be a valid NotificationType enum value',
  })
  type?: string;

  @ApiPropertyOptional({
    description: 'Filter theo status (READ hoặc UNREAD)',
    example: 'UNREAD',
    enum: NotificationStatus,
  })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;
}

/**
 * NotificationResponseDto - DTO cho notification response
 * Chứa tất cả thông tin của notification để trả về cho client
 */
export class NotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  user_id: string;

  @ApiPropertyOptional()
  sender_id?: string;

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
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
