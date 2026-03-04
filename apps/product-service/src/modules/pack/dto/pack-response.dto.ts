import { Exclude, Expose, Transform, Type } from 'class-transformer';

import { ItemWithQuantityResponseDto } from '@/common/dto/item-response.dto';
import { ListWithQuantityResponseDto } from '@/modules/list/dto/list-response.dto';

@Exclude()
export class PackBaseResponseDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() description: string | null;
  @Expose() colorCode: string | null;
}

@Exclude()
export class PackResponseDto extends PackBaseResponseDto {
  @Expose()
  @Type(() => ItemWithQuantityResponseDto)
  items?: ItemWithQuantityResponseDto[];

  @Expose()
  @Type(() => ListWithQuantityResponseDto)
  lists?: ListWithQuantityResponseDto[];
}

@Exclude()
export class PackSummaryResponseDto extends PackBaseResponseDto {
  @Expose()
  @Transform(({ obj }: { obj: { _count?: { items: number } } }) => obj._count?.items ?? 0)
  itemCount: number;

  @Expose()
  @Transform(({ obj }: { obj: { _count?: { lists: number } } }) => obj._count?.lists ?? 0)
  listCount: number;
}
