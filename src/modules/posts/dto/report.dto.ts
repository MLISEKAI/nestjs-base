// Import decorators từ Swagger để tạo API documentation
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// Import decorators từ class-validator để validate dữ liệu
import { IsString, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { ReportTargetType } from 'src/common/enums/report-target';

/**
 * CreateReportDto - DTO để tạo report
 *
 * Lưu ý:
 * - targetType: Bắt buộc, loại đối tượng bị report (post, user, comment)
 * - targetId: Bắt buộc, ID của đối tượng bị report
 * - reasonId: Bắt buộc, ID của lý do report (1-4)
 * - comment: Optional, bình luận thêm nếu có
 */
export class CreateReportDto {
  @ApiProperty({
    example: 'post',
    enum: ReportTargetType,
    description: 'Loại đối tượng bị report',
  })
  @IsEnum(ReportTargetType)
  @IsNotEmpty()
  targetType: ReportTargetType;

  @ApiProperty({ example: 'post-886', description: 'ID của đối tượng bị report' })
  @IsString()
  @IsNotEmpty()
  targetId: string;

  @ApiProperty({ example: 2, description: 'ID của lý do report' })
  @IsNotEmpty()
  reasonId: number;

  @ApiPropertyOptional({ example: 'Additional comment', description: 'Bình luận thêm (nếu có)' })
  @IsOptional()
  @IsString()
  comment?: string;
}
