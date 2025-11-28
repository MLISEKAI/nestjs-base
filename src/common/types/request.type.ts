import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export type HeaderRequest = {
  'cf-ipcountry'?: string;
  authorization?: string;
  'bc-sign'?: string;
  'bc-nonce'?: string;
  'bc-payload'?: string;
  dt?: string;
  di: string;
  dm?: string;
  ov?: string;
  ot?: string;
  lang?: string;
  location?: string;
  ip?: string;
  timezone?: string;
};

export class GeoPointDto {
  @ApiProperty({
    example: 'Point',
    description: 'GeoJSON type (always "Point")',
    enum: ['Point'],
  })
  @IsString()
  type: 'Point';

  @ApiProperty({
    example: [105.8542, 21.0285],
    description: 'Coordinates in [longitude, latitude] format',
    type: 'array',
    items: { type: 'number' },
  })
  @IsArray()
  coordinates: [number, number];
}
