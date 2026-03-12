import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose, Transform, Type } from 'class-transformer';

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
  @ApiProperty({ description: 'Pack color code', example: '#000000', nullable: true, type: String })
  @Expose()
  colorCode: string | null;
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
  @ApiProperty({ description: 'Pack item count', example: 1 })
  @Expose()
  @Transform(({ obj }: { obj: { _count?: { items: number } } }) => obj._count?.items ?? 0)
  itemCount: number;

  @ApiProperty({ description: 'Pack list count', example: 1 })
  @Expose()
  @Transform(({ obj }: { obj: { _count?: { lists: number } } }) => obj._count?.lists ?? 0)
  listCount: number;
}
