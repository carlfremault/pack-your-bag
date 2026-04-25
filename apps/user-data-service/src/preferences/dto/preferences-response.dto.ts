import { ApiProperty } from '@nestjs/swagger';

import { DateFormat, Theme, TimeFormat, Units } from '@repo/constants';

import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class PreferencesResponseDto {
  @ApiProperty({ description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  userId: string;

  @ApiProperty({ description: 'Units', example: 'metric', enum: Units })
  @Expose()
  units: Units;

  @ApiProperty({ description: 'Theme', example: 'light', nullable: true, enum: Theme })
  @Expose()
  theme: Theme | null;

  @ApiProperty({ description: 'Date format', example: 'DD/MM/YYYY', enum: DateFormat })
  @Expose()
  dateFormat: DateFormat;

  @ApiProperty({ description: 'Time format', example: '12h', enum: TimeFormat })
  @Expose()
  timeFormat: TimeFormat;

  @ApiProperty({ description: 'Created at', example: '2026-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Updated at', example: '2026-01-01T00:00:00.000Z' })
  @Expose()
  updatedAt: Date;
}
