import { ApiProperty, OmitType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  IsDateString,
} from 'class-validator';
import { UserBasicRole, ProviderEnum } from '@prisma/client';

export class RegisterUserDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Email is not valid' })
  email?: string;

  @ApiProperty({ description: 'User phone number', example: '+84912345678' })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiProperty({
    description:
      'Password (8-20 characters, at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character)',
    example: 'P@ssw0rd1',
    minLength: 8,
    maxLength: 20,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/, {
    message:
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character',
  })
  password: string;

  @ApiProperty({ description: 'Nickname of user', example: 'NguyenVanA' })
  @IsString()
  @IsNotEmpty()
  nickname: string;

  @ApiProperty({ description: 'User avatar URL', example: 'https://avatar.com/a.png', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ description: 'User bio', example: 'I love coding', required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ description: 'User gender', example: 'male', required: false })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ description: 'User birthday', example: '2000-01-01', required: false })
  @IsOptional()
  @IsDateString()
  birthday?: Date;

  @ApiProperty({ description: 'Role', example: 'user', enum: UserBasicRole, required: false })
  @IsOptional()
  @IsEnum(UserBasicRole)
  role?: UserBasicRole = 'user';
}

export class LoginDto {
  @ApiProperty({ description: 'Email or phone to login', example: 'user@example.com' })
  @IsNotEmpty()
  @IsString()
  ref_id: string;

  @ApiProperty({ description: 'Password', example: 'P@ssw0rd1' })
  @IsNotEmpty()
  @IsString()
  password: string;
}
