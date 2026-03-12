import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose, Type } from 'class-transformer';

import { ItemResponseDto } from '@/common/dto/item-response.dto';
import { ListResponseDto } from '@/modules/list/dto/list-response.dto';
import { PackResponseDto } from '@/modules/pack/dto/pack-response.dto';
import { TripResponseDto } from '@/modules/trip/dto/trip-response.dto';

@Exclude()
export class ItemDeleteImpactDto {
  @ApiProperty({ type: ItemResponseDto })
  @Expose()
  @Type(() => ItemResponseDto)
  item: ItemResponseDto;
  @ApiProperty({ type: [ListResponseDto] })
  @Expose()
  @Type(() => ListResponseDto)
  lists: ListResponseDto[];
  @ApiProperty({ type: [PackResponseDto] })
  @Expose()
  @Type(() => PackResponseDto)
  packs: PackResponseDto[];
  @ApiProperty({ type: [TripResponseDto] })
  @Expose()
  @Type(() => TripResponseDto)
  trips: TripResponseDto[];
}
