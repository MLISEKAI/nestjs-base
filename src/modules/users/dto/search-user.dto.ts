import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SearchUserDto {
  @ApiPropertyOptional({ example: 'NguyenVanA', description: 'Từ khóa tìm kiếm' })
  @IsOptional()
  @IsString()
  search?: string;
}
