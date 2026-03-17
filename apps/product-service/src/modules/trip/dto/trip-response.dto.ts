import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose, Type } from 'class-transformer';

import { PackResponseDto } from '@/modules/pack/dto/pack-response.dto';

@Exclude()
export class TripResponseDto {
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

  @ApiProperty({ description: 'Pack used in trip', type: PackResponseDto })
  @Expose()
  @Type(() => PackResponseDto)
  pack: PackResponseDto;

  @ApiProperty({ description: 'Trip created at', example: '2026-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Trip updated at', example: '2026-01-01T00:00:00.000Z' })
  @Expose()
  updatedAt: Date;
}
