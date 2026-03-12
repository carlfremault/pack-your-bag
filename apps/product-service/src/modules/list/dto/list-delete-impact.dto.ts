import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose, Type } from 'class-transformer';

import { PackResponseDto } from '@/modules/pack/dto/pack-response.dto';
import { TripResponseDto } from '@/modules/trip/dto/trip-response.dto';

import { ListSummaryResponseDto } from './list-response.dto';

@Exclude()
export class ListDeleteImpactDto {
  @ApiProperty({ type: ListSummaryResponseDto })
  @Expose()
  @Type(() => ListSummaryResponseDto)
  list: ListSummaryResponseDto;
  @ApiProperty({ type: [PackResponseDto] })
  @Expose()
  @Type(() => PackResponseDto)
  packs: PackResponseDto[];
  @ApiProperty({ type: [TripResponseDto] })
  @Expose()
  @Type(() => TripResponseDto)
  trips: TripResponseDto[];
}
