import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose } from 'class-transformer';

import { DateFormat, Theme, TimeFormat, Units } from '../types/preferences.types';

@Exclude()
export class PreferencesResponseDto {
  @ApiProperty({ description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  userId: string;

  @ApiProperty({ description: 'Units', example: 'metric' })
  @Expose()
  units: Units;

  @ApiProperty({ description: 'Theme', example: 'light' })
  @Expose()
  theme: Theme;

  @ApiProperty({ description: 'Date format', example: 'DD/MM/YYYY' })
  @Expose()
  dateFormat: DateFormat;

  @ApiProperty({ description: 'Time format', example: '12h' })
  @Expose()
  timeFormat: TimeFormat;

  @ApiProperty({ description: 'Created at', example: '2026-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Updated at', example: '2026-01-01T00:00:00.000Z' })
  @Expose()
  updatedAt: Date;
}
