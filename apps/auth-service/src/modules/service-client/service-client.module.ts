import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ServiceClientService } from './service-client.service';

@Module({
  imports: [ConfigModule],
  providers: [ServiceClientService],
  exports: [ServiceClientService],
})
export class ServiceClientModule {}
