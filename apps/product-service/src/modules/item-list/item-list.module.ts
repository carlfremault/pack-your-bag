import { Module } from '@nestjs/common';

import { ItemListController } from './item-list.controller';
import { ItemListService } from './item-list.service';

@Module({
  controllers: [ItemListController],
  providers: [ItemListService],
})
export class ItemListModule {}
