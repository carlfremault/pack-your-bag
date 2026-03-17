import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose, Type } from 'class-transformer';

import { CategoryResponseDto } from '@/modules/category/dto/category-response.dto';

@Exclude()
export class ItemResponseDto {
  @ApiProperty({ description: 'Item uuid', example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Item name', example: 'Item name' })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Item description',
    example: 'Item description',
    nullable: true,
    type: String,
  })
  @Expose()
  description: string | null;

  @ApiProperty({ description: 'Item weight', example: 100, nullable: true })
  @Expose()
  weight: number | null;

  @ApiProperty({ description: 'Item category', type: CategoryResponseDto })
  @Expose()
  @Type(() => CategoryResponseDto)
  category: CategoryResponseDto;

  @ApiProperty({ description: 'Item created at', example: '2026-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Item updated at', example: '2026-01-01T00:00:00.000Z' })
  @Expose()
  updatedAt: Date;
}

@Exclude()
export class ItemWithQuantityResponseDto {
  @ApiProperty({ description: 'Item quantity', example: 1 })
  @Expose()
  quantity: number;

  @ApiProperty({ description: 'Item', type: ItemResponseDto })
  @Expose()
  @Type(() => ItemResponseDto)
  item: ItemResponseDto;
}
