import { Exclude, Expose, Transform, Type } from 'class-transformer';

import { ItemWithQuantityResponseDto } from '@/common/dto/item-response.dto';

@Exclude()
export class ListBaseResponseDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() description: string | null;
  @Expose() colorCode: string | null;
}

@Exclude()
export class ListResponseDto extends ListBaseResponseDto {
  @Expose()
  @Type(() => ItemWithQuantityResponseDto)
  items?: ItemWithQuantityResponseDto[];
}

@Exclude()
export class ListWithQuantityResponseDto {
  @Expose() quantity: number;

  @Expose()
  @Type(() => ListResponseDto)
  list: ListResponseDto;
}

@Exclude()
export class ListSummaryResponseDto extends ListBaseResponseDto {
  @Expose()
  @Transform(({ obj }: { obj: { _count?: { items: number } } }) => obj._count?.items ?? 0)
  itemCount: number;
}
