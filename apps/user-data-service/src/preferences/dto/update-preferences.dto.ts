import { ApiPropertyOptional } from '@nestjs/swagger';

import { DateFormat, Theme, TimeFormat, Units } from '@repo/constants';

import { IsEnum, IsOptional, ValidateIf } from 'class-validator';

export class UpdatePreferencesDto {
  @ApiPropertyOptional({ description: 'Units', example: 'metric', enum: Units })
  @IsOptional()
  @IsEnum(Units)
  units?: Units;

  @ApiPropertyOptional({ description: 'Theme', example: 'light', nullable: true, enum: Theme })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsEnum(Theme)
  theme?: Theme | null;

  @ApiPropertyOptional({ description: 'Date format', example: 'DD/MM/YYYY', enum: DateFormat })
  @IsOptional()
  @IsEnum(DateFormat)
  dateFormat?: DateFormat;

  @ApiPropertyOptional({ description: 'Time format', example: '12h', enum: TimeFormat })
  @IsOptional()
  @IsEnum(TimeFormat)
  timeFormat?: TimeFormat;
}
