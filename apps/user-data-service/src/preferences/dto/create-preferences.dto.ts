import { ApiProperty } from '@nestjs/swagger';

import { IsEnum, IsOptional, IsString } from 'class-validator';

import { DateFormat, Theme, TimeFormat, Units } from '../types/preferences.types';

export class CreatePreferencesDto {
  @ApiProperty({ description: 'Units', example: 'metric' })
  @IsString()
  @IsOptional()
  @IsEnum(Units)
  units: Units;

  @ApiProperty({ description: 'Theme', example: 'light' })
  @IsString()
  @IsOptional()
  @IsEnum(Theme)
  theme: Theme;

  @ApiProperty({ description: 'Date format', example: 'DD/MM/YYYY' })
  @IsString()
  @IsOptional()
  @IsEnum(DateFormat)
  dateFormat: DateFormat;

  @ApiProperty({ description: 'Time format', example: '12h' })
  @IsString()
  @IsOptional()
  @IsEnum(TimeFormat)
  timeFormat: TimeFormat;
}
