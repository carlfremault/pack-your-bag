import { Module } from '@nestjs/common';

import { ItemPackController } from './item-pack.controller';
import { ItemPackService } from './item-pack.service';

@Module({
  providers: [ItemPackService],
  controllers: [ItemPackController],
})
export class ItemPackModule {}
