import { IsString, IsEnum, IsArray, IsBoolean, IsOptional, MinLength, MaxLength, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoomMode, RoomLabel } from '../../../common/enums';

export class CreateRoomDto {
  @ApiProperty({
    description: 'Tiêu đề phòng',
    example: 'From Hani With Love',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  title: string;

  @ApiProperty({
    description: 'Chế độ phòng (phải đúng 1 trong 4 giá trị để hiển thị icon đúng)',
    enum: ['game', 'make_friends', 'party', 'auction'],
    example: 'party',
  })
  @IsEnum(RoomMode)
  mode: RoomMode;

  @ApiPropertyOptional({
    description: 'Nhãn phòng (tối đa 3, FE sẽ hiển thị tag màu đỏ)',
    example: ['Giải trí', 'Trò chuyện'],
    type: [String],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  labels?: string[];

  @ApiPropertyOptional({
    description: 'true = phòng có mật khẩu, false = công khai',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  is_protected?: boolean;

  @ApiPropertyOptional({
    description: 'Mật khẩu phòng (bắt buộc nếu is_protected = true, nếu false thì bỏ qua)',
    example: '123456',
  })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({
    description: 'Số người tối đa trong phòng (mặc định 10)',
    example: 10,
    minimum: 2,
    maximum: 50,
    default: 10,
  })
  @IsNumber()
  @Min(2)
  @Max(50)
  @IsOptional()
  maxParticipants?: number;
}

export class SetPasswordDto {
  @ApiProperty({
    description: 'Mật khẩu phòng (4 chữ số)',
    example: '7777',
    minLength: 4,
    maxLength: 4,
  })
  @IsString()
  @MinLength(4)
  @MaxLength(4)
  password: string;
}

export class VerifyPasswordDto {
  @ApiProperty({
    description: 'Mật khẩu để xác thực',
    example: '7777',
    minLength: 4,
    maxLength: 4,
  })
  @IsString()
  @MinLength(4)
  @MaxLength(4)
  password: string;
}

export class JoinRoomDto {
  @ApiPropertyOptional({
    description: 'Mật khẩu phòng (nếu phòng có mật khẩu)',
    example: '7777',
  })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({
    description: 'Access token từ verify-password',
    example: 'room_access_token_xyz',
  })
  @IsString()
  @IsOptional()
  accessToken?: string;
}
