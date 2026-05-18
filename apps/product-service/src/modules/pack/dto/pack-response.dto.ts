import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose, Type } from 'class-transformer';

import { ItemWithQuantityResponseDto } from '@/common/dto/item-response.dto';
import { ListWithQuantityResponseDto } from '@/modules/list/dto/list-response.dto';

@Exclude()
export class PackBaseResponseDto {
  @ApiProperty({ description: 'Pack uuid', example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Pack name', example: 'Pack name' })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Pack description',
    example: 'Pack description',
    nullable: true,
    type: String,
  })
  @Expose()
  description: string | null;

  @ApiProperty({
    description: 'Pack color theme',
    example: 'slate',
    nullable: true,
    type: String,
  })
  @Expose()
  colorTheme: string | null;

  @ApiProperty({ description: 'Pack created at', example: '2026-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Pack updated at', example: '2026-01-01T00:00:00.000Z' })
  @Expose()
  updatedAt: Date;
}

@Exclude()
export class PackResponseDto extends PackBaseResponseDto {
  @ApiProperty({
    description: 'Items in pack',
    type: [ItemWithQuantityResponseDto],
    required: false,
  })
  @Expose()
  @Type(() => ItemWithQuantityResponseDto)
  items?: ItemWithQuantityResponseDto[];

  @ApiProperty({
    description: 'Lists in pack',
    type: [ListWithQuantityResponseDto],
    required: false,
  })
  @Expose()
  @Type(() => ListWithQuantityResponseDto)
  lists?: ListWithQuantityResponseDto[];
}

@Exclude()
export class PackSummaryResponseDto extends PackBaseResponseDto {
  @ApiProperty({
    description: 'Total quantity of all items in the pack, including items in lists',
    example: 30,
  })
  @Expose()
  itemCount: number;

  @ApiProperty({ description: 'Total weight of all items in the pack in grams', example: 2500 })
  @Expose()
  totalWeight: number;
}
