import { Exclude, Expose, Type } from 'class-transformer';

import { CategoryResponseDto } from '@/modules/category/dto/category-response.dto';

@Exclude()
export class ItemResponseDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() description: string | null;
  @Expose() weight: number | null;

  @Expose()
  @Type(() => CategoryResponseDto)
  category: CategoryResponseDto;
}

@Exclude()
export class ItemWithQuantityResponseDto {
  @Expose() quantity: number;

  @Expose()
  @Type(() => ItemResponseDto)
  item: ItemResponseDto;
}
