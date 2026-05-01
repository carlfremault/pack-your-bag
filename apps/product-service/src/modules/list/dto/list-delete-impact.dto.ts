import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose, Type } from 'class-transformer';

import { PackResponseDto } from '@/modules/pack/dto/pack-response.dto';
import { TripResponseDto } from '@/modules/trip/dto/trip-response.dto';

import { ListBaseResponseDto } from './list-response.dto';

@Exclude()
export class ListDeleteImpactDto {
  @ApiProperty({ type: ListBaseResponseDto })
  @Expose()
  @Type(() => ListBaseResponseDto)
  list: ListBaseResponseDto;
  @ApiProperty({ type: [PackResponseDto] })
  @Expose()
  @Type(() => PackResponseDto)
  packs: PackResponseDto[];
  @ApiProperty({ type: [TripResponseDto] })
  @Expose()
  @Type(() => TripResponseDto)
  trips: TripResponseDto[];
}
