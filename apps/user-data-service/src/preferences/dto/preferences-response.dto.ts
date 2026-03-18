import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class PreferencesResponseDto {
  @ApiProperty({ description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  userId: string;

  @ApiProperty({ description: 'Units', example: 'metric' })
  @Expose()
  units: 'metric' | 'imperial';

  @ApiProperty({ description: 'Theme', example: 'light' })
  @Expose()
  theme: 'light' | 'dark';

  @ApiProperty({ description: 'Date format', example: 'DD/MM/YYYY' })
  @Expose()
  dateFormat:
    | 'DD/MM/YYYY'
    | 'MM/DD/YYYY'
    | 'YYYY/MM/DD'
    | 'DD-MM/YYYY'
    | 'MM-DD/YYYY'
    | 'YYYY-MM-DD';

  @ApiProperty({ description: 'Time format', example: '12h' })
  @Expose()
  timeFormat: '12h' | '24h';

  @ApiProperty({ description: 'Created at', example: '2026-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Updated at', example: '2026-01-01T00:00:00.000Z' })
  @Expose()
  updatedAt: Date;
}
