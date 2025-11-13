import { ApiProperty } from '@nestjs/swagger';

export class StoreItemDto {
  @ApiProperty({ example: 'item-1' })
  id: string;

  @ApiProperty({ example: 'Sword' })
  name: string;

  @ApiProperty({ example: 100 })
  price: number;
}

export class StoreDto {
  @ApiProperty({ type: [StoreItemDto] })
  items: StoreItemDto[];
}
