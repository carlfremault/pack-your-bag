import { Module } from '@nestjs/common';

import { ListPackController } from './list-pack.controller';
import { ListPackService } from './list-pack.service';

@Module({
  providers: [ListPackService],
  controllers: [ListPackController],
})
export class ListPackModule {}
