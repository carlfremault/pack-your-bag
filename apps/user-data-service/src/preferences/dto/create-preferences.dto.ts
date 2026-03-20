import { ApiProperty } from '@nestjs/swagger';

import { IsIn, IsOptional, IsString } from 'class-validator';

import { DateFormat, Theme, TimeFormat, Units } from '../types/preferences.types';

export class CreatePreferencesDto {
  @ApiProperty({ description: 'Units', example: 'metric' })
  @IsString()
  @IsOptional()
  @IsIn(Object.values(Units))
  units: Units;

  @ApiProperty({ description: 'Theme', example: 'light' })
  @IsString()
  @IsOptional()
  @IsIn(Object.values(Theme))
  theme: Theme;

  @ApiProperty({ description: 'Date format', example: 'DD/MM/YYYY' })
  @IsString()
  @IsOptional()
  @IsIn(Object.values(DateFormat))
  dateFormat: DateFormat;

  @ApiProperty({ description: 'Time format', example: '12h' })
  @IsString()
  @IsOptional()
  @IsIn(Object.values(TimeFormat))
  timeFormat: TimeFormat;
}
