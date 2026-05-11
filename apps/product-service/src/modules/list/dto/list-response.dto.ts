import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose, Type } from 'class-transformer';

import { ItemWithQuantityResponseDto } from '@/common/dto/item-response.dto';

@Exclude()
export class ListBaseResponseDto {
  @ApiProperty({ description: 'List uuid', example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'List name', example: 'List name' })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'List description',
    example: 'List description',
    nullable: true,
    type: String,
  })
  @Expose()
  description: string | null;

  @ApiProperty({ description: 'List color code', example: '#000000', nullable: true, type: String })
  @Expose()
  colorTheme: string | null;

  @ApiProperty({ description: 'List created at', example: '2026-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'List updated at', example: '2026-01-01T00:00:00.000Z' })
  @Expose()
  updatedAt: Date;
}

@Exclude()
export class ListResponseDto extends ListBaseResponseDto {
  @ApiProperty({
    description: 'Items on list',
    type: [ItemWithQuantityResponseDto],
    required: false,
  })
  @Expose()
  @Type(() => ItemWithQuantityResponseDto)
  items?: ItemWithQuantityResponseDto[];
}

@Exclude()
export class ListWithQuantityResponseDto {
  @ApiProperty({ description: 'List quantity', example: 1 })
  @Expose()
  quantity: number;

  @ApiProperty({ description: 'List', type: ListResponseDto })
  @Expose()
  @Type(() => ListResponseDto)
  list: ListResponseDto;
}

@Exclude()
export class ListSummaryResponseDto extends ListBaseResponseDto {
  @ApiProperty({ description: 'Total quantity of items in the list', example: 3 })
  @Expose()
  itemCount: number;

  @ApiProperty({ description: 'Total weight of all items in the list in grams', example: 1500 })
  @Expose()
  totalWeight: number;
}
