import { ApiProperty } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { NAME_MAX_LENGTH, REMARKS_MAX_LENGTH } from '@/common/constants/product.constants';

export class CreateTripDto {
  @ApiProperty({ description: 'Trip name', example: 'Trip name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(NAME_MAX_LENGTH)
  name: string;

  @ApiProperty({
    description: 'Trip date',
    example: '2026-01-01T00:00:00.000Z',
    required: false,
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  date?: Date;

  @ApiProperty({
    description: 'Trip remarks',
    example: 'Trip remarks',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(REMARKS_MAX_LENGTH)
  remarks?: string;

  @ApiProperty({
    description: 'Pack uuid associated with the trip',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  @IsUUID()
  @IsOptional()
  packId?: string;
}
