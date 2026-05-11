import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose, Type } from 'class-transformer';

import { PackResponseDto, PackSummaryResponseDto } from '@/modules/pack/dto/pack-response.dto';

@Exclude()
export class TripBaseResponseDto {
  @ApiProperty({ description: 'Trip uuid', example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Trip name', example: 'Trip name' })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Trip date',
    example: '2026-01-01T00:00:00.000Z',
    nullable: true,
    type: Date,
  })
  @Expose()
  date: Date | null;

  @ApiProperty({
    description: 'Trip remarks',
    example: 'Trip remarks',
    nullable: true,
    type: String,
  })
  @Expose()
  remarks: string | null;

  @ApiProperty({ description: 'Trip created at', example: '2026-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Trip updated at', example: '2026-01-01T00:00:00.000Z' })
  @Expose()
  updatedAt: Date;
}

@Exclude()
export class TripSummaryResponseDto extends TripBaseResponseDto {
  @ApiProperty({ description: 'Pack Summary used in trip', type: PackSummaryResponseDto })
  @Expose()
  @Type(() => PackSummaryResponseDto)
  pack: PackSummaryResponseDto;

  @ApiProperty({ description: 'Number of items packed in the assigned pack', example: 5 })
  @Expose()
  packedItemCount: number;
}

@Exclude()
export class TripResponseDto extends TripBaseResponseDto {
  @ApiProperty({ description: 'Pack used in trip', type: PackResponseDto })
  @Expose()
  @Type(() => PackResponseDto)
  pack: PackResponseDto;
}
