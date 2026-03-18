import { ApiProperty } from '@nestjs/swagger';

import { IsOptional, IsString } from 'class-validator';

export class CreatePreferencesDto {
  @ApiProperty({ description: 'Units', example: 'metric' })
  @IsString()
  @IsOptional()
  units: 'metric' | 'imperial';

  @ApiProperty({ description: 'Theme', example: 'light' })
  @IsString()
  @IsOptional()
  theme: 'light' | 'dark';

  @ApiProperty({ description: 'Date format', example: 'DD/MM/YYYY' })
  @IsString()
  @IsOptional()
  dateFormat:
    | 'DD/MM/YYYY'
    | 'MM/DD/YYYY'
    | 'YYYY/MM/DD'
    | 'DD-MM-YYYY'
    | 'MM-DD-YYYY'
    | 'YYYY-MM-DD';

  @ApiProperty({ description: 'Time format', example: '12h' })
  @IsString()
  @IsOptional()
  timeFormat: '12h' | '24h';
}
