import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID, ArrayMinSize, ArrayMaxSize } from 'class-validator';

/**
 * Warmup target types
 */
export enum WarmupTargetType {
  USER = 'user',
  POST = 'post',
  NOTIFICATION = 'notification',
  FEED = 'feed',
  SEARCH = 'search',
}

/**
 * DTO for selective cache warmup request
 */
export class SelectiveWarmupDto {
  @ApiProperty({
    description: 'Type of data to warmup',
    enum: WarmupTargetType,
    example: WarmupTargetType.USER,
  })
  @IsEnum(WarmupTargetType)
  targetType: WarmupTargetType;

  @ApiPropertyOptional({
    description: 'Target IDs to warmup (max 100)',
    type: [String],
    example: ['user-id-1', 'user-id-2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  targetIds?: string[];

  @ApiPropertyOptional({
    description: 'Reason for warmup (for logging)',
    example: 'After batch user import',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * DTO for single user warmup
 */
export class WarmupUserDto {
  @ApiProperty({
    description: 'User ID to warmup',
    example: 'user-id-123',
  })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({
    description: 'Include user posts in warmup',
    example: true,
  })
  @IsOptional()
  includePosts?: boolean;

  @ApiPropertyOptional({
    description: 'Include user notifications in warmup',
    example: true,
  })
  @IsOptional()
  includeNotifications?: boolean;
}

/**
 * Response DTO for selective warmup
 */
export class SelectiveWarmupResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Number of keys warmed',
    example: 15,
  })
  keysWarmed: number;

  @ApiProperty({
    description: 'Duration in milliseconds',
    example: 1250,
  })
  durationMs: number;

  @ApiProperty({
    description: 'Target type',
    example: 'user',
  })
  targetType: string;

  @ApiProperty({
    description: 'Number of targets processed',
    example: 5,
  })
  targetsProcessed: number;

  @ApiPropertyOptional({
    description: 'Failed targets',
    type: [String],
    example: [],
  })
  failedTargets?: string[];

  @ApiProperty({
    description: 'Trace ID for debugging',
    example: 'selective-warmup-1701432000000-abc123',
  })
  traceId: string;
}
