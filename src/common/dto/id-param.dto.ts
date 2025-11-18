import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

/**
 * ID parameter DTO for route parameters
 */
export class IdParamDto {
  @ApiProperty({
    example: 'user-123',
    description: 'Resource ID',
  })
  @IsNotEmpty()
  @IsString()
  id: string;
}

/**
 * UUID parameter DTO for route parameters
 */
export class UuidParamDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Resource UUID',
  })
  @IsNotEmpty()
  @IsUUID()
  id: string;
}
