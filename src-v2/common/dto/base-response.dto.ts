import { ApiProperty } from '@nestjs/swagger';

export class BaseResponseDto<T> {
  @ApiProperty({ example: false })
  error: boolean;

  @ApiProperty({ example: 1 })
  code: number;

  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty()
  data: T;

  @ApiProperty({ example: 'trace-123456' })
  traceId: string;
}

