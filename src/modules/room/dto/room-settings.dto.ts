import { IsString, IsBoolean, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRoomSettingsDto {
  @ApiPropertyOptional({
    description: 'Tên phòng mới',
    example: 'Party Room Updated',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Mô tả phòng',
    example: 'Chill & Connect with friends',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Thông báo phòng',
    example: 'Welcome! Please be respectful.',
  })
  @IsString()
  @IsOptional()
  notice?: string;

  @ApiPropertyOptional({
    description: 'Phòng riêng tư',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  private?: boolean;

  @ApiPropertyOptional({
    description: 'Giới hạn tuổi',
    example: 18,
  })
  @IsNumber()
  @IsOptional()
  age_limit?: number;

  @ApiPropertyOptional({
    description: 'Vô hiệu hóa tin nhắn',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  disableMessage?: boolean;

  @ApiPropertyOptional({
    description: 'Vô hiệu hóa lì xì',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  disableLuckyMoney?: boolean;

  @ApiPropertyOptional({
    description: 'Vô hiệu hóa gửi ảnh',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  disableImage?: boolean;
}

export class SetRoomModeDto {
  @ApiProperty({
    description: 'Chế độ phòng mới',
    example: 'music',
    enum: ['party', 'friend', 'chat', 'game', 'entertain', 'music'],
  })
  @IsString()
  mode: string;
}

export class SetSeatLayoutDto {
  @ApiProperty({
    description: 'ID layout ghế',
    example: 'layout_3',
    enum: ['layout_1', 'layout_2', 'layout_3', 'layout_4'],
  })
  @IsString()
  layout_id: string;
}

export class AssignSeatDto {
  @ApiProperty({
    description: 'Số ghế (1-12)',
    example: 3,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  seat_id: number;

  @ApiProperty({
    description: 'ID người dùng',
    example: 'u456',
  })
  @IsString()
  user_id: string;
}
