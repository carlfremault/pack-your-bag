import { Module } from '@nestjs/common';

import { ItemController } from './item.controller';
import { ItemService } from './item.service';

@Module({
  providers: [ItemService],
  controllers: [ItemController],
})
export class ItemModule {}
