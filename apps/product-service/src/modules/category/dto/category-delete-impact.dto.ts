import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose, Type } from 'class-transformer';

import { ItemResponseDto } from '@/common/dto/item-response.dto';

import { CategoryResponseDto } from './category-response.dto';

@Exclude()
export class CategoryDeleteImpactDto {
  @ApiProperty({ type: CategoryResponseDto })
  @Expose()
  @Type(() => CategoryResponseDto)
  category: CategoryResponseDto;

  @ApiProperty({ type: [ItemResponseDto] })
  @Expose()
  @Type(() => ItemResponseDto)
  items: ItemResponseDto[];
}
