import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PageOptionsDto } from 'src/common';

export class UpdateProfileDto {
  @ApiProperty({
    example: 'Devil Senoper',
    description: 'Name user',
  })
  @IsString()
  @IsOptional()
  nickname: string;
}

export class PaginationUser extends PageOptionsDto {}
export class PaginationAssociates extends PageOptionsDto {}
