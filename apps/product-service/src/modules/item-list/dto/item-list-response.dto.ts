import { ApiProperty } from '@nestjs/swagger';

export class ItemListResponseDto {
  @ApiProperty({ description: 'ItemList uuid', example: '019de406-4785-71b8-8b00-b1706a4c05f2' })
  id: string;

  @ApiProperty({ description: 'Item quantity', example: 1 })
  quantity: number;

  @ApiProperty({ description: 'Item uuid', example: '019de3fc-ce73-70cd-a76b-edb429342fb7' })
  itemId: string;

  @ApiProperty({ description: 'List uuid', example: '019de402-dcc9-758e-af7b-b2cf9339b175' })
  listId: string;
}
