import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose, Type } from 'class-transformer';

import { TripResponseDto } from '@/modules/trip/dto/trip-response.dto';

import { PackSummaryResponseDto } from './pack-response.dto';

@Exclude()
export class PackDeleteImpactDto {
  @ApiProperty({ type: PackSummaryResponseDto })
  @Expose()
  @Type(() => PackSummaryResponseDto)
  pack: PackSummaryResponseDto;
  @ApiProperty({ type: [TripResponseDto] })
  @Expose()
  @Type(() => TripResponseDto)
  trips: TripResponseDto[];
}
