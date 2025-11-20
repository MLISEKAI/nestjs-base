import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsDateString, IsNumber, IsIn } from 'class-validator';

export class EventDto {
  @ApiProperty({ example: 'event-1' })
  id: string;

  @ApiProperty({ example: 'user-1' })
  created_by: string;

  @ApiProperty({ example: 'Tech Meetup' })
  title: string;

  @ApiPropertyOptional({ example: 'A great tech meetup' })
  description?: string;

  @ApiPropertyOptional({ example: 'San Francisco' })
  location?: string;

  @ApiProperty({ example: '2025-12-01T10:00:00.000Z' })
  start_time: Date;

  @ApiPropertyOptional({ example: '2025-12-01T18:00:00.000Z' })
  end_time?: Date;

  @ApiProperty({ example: false })
  is_public: boolean;

  @ApiPropertyOptional({ example: 100 })
  max_participants?: number;

  @ApiProperty({ example: '2025-11-12T00:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2025-11-12T00:00:00.000Z' })
  updated_at: Date;

  @ApiPropertyOptional({ description: 'Participants count' })
  participants_count?: number;

  @ApiPropertyOptional({ description: 'User participation status' })
  user_status?: string;
}

export class CreateEventDto {
  @ApiProperty({ example: 'Tech Meetup' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'A great tech meetup' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'San Francisco' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: '2025-12-01T10:00:00.000Z' })
  @IsDateString()
  start_time: string;

  @ApiPropertyOptional({ example: '2025-12-01T18:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  end_time?: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  is_public: boolean;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  max_participants?: number;
}

export class UpdateEventDto {
  @ApiPropertyOptional({ example: 'Updated Tech Meetup' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'New York' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: '2025-12-01T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  start_time?: string;

  @ApiPropertyOptional({ example: '2025-12-01T18:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  end_time?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @IsNumber()
  max_participants?: number;
}

export class JoinEventDto {
  @ApiProperty({
    example: 'going',
    description: 'Participation status: going, maybe, not_going',
    enum: ['going', 'maybe', 'not_going'],
  })
  @IsString()
  @IsIn(['going', 'maybe', 'not_going'])
  status: string;
}
