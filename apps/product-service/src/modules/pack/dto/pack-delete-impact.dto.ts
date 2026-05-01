import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose, Type } from 'class-transformer';

import { TripResponseDto } from '@/modules/trip/dto/trip-response.dto';

import { PackBaseResponseDto } from './pack-response.dto';

@Exclude()
export class PackDeleteImpactDto {
  @ApiProperty({ type: PackBaseResponseDto })
  @Expose()
  @Type(() => PackBaseResponseDto)
  pack: PackBaseResponseDto;
  @ApiProperty({ type: [TripResponseDto] })
  @Expose()
  @Type(() => TripResponseDto)
  trips: TripResponseDto[];
}
