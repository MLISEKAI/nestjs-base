import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsNotEmpty } from "class-validator";

export class LoveConnectionDto {
  @ApiProperty({ example: 'c1' })
  id: string;

  @ApiProperty({ example: 'user-1' })
  user_a_id: string;

  @ApiProperty({ example: 'user-2' })
  user_b_id: string;

  @ApiProperty({ example: '2025-11-11T00:00:00.000Z' })
  created_at: Date;
}

export class LoveSpaceDto {
  @ApiProperty({ example: 'About us...' })
  bio?: string;
}

export class CreateLoveSpaceDto {
  @ApiProperty({ example: 'Our story', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  bio?: string;
}

export class UpdateLoveSpaceDto {
  @ApiProperty({ example: 'Updated bio', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  bio?: string;
}

