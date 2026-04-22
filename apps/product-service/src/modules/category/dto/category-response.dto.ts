import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class CategoryResponseDto {
  @ApiProperty({ description: 'Category uuid', example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Category name', example: 'Category name' })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Category description',
    example: 'Category description',
    nullable: true,
    type: String,
  })
  @Expose()
  description: string | null;

  @ApiProperty({
    description: 'Category color code',
    example: 'slate',
    type: String,
  })
  @Expose()
  colorTheme: string;

  @ApiProperty({ description: 'Category created at', example: '2026-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Category updated at', example: '2026-01-01T00:00:00.000Z' })
  @Expose()
  updatedAt: Date;
}
