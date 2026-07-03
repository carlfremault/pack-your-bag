import { Module } from '@nestjs/common';

import { RMQ_PUBLISHERS, RMQ_QUEUES, RmqPublisherModule } from '@repo/nestjs-common';

import { RefreshTokenModule } from '@/modules/refresh-token/refresh-token.module';
import { UserModule } from '@/modules/user/user.module';
import { VerificationTokenModule } from '@/modules/verification-token/verification-token.module';

import { TasksService } from './tasks.service';

@Module({
  imports: [
    RefreshTokenModule,
    VerificationTokenModule,
    UserModule,
    RmqPublisherModule.register([
      { name: RMQ_PUBLISHERS.USER_CLEANUP_PRODUCT, queue: RMQ_QUEUES.USER_CLEANUP_PRODUCT },
      { name: RMQ_PUBLISHERS.USER_CLEANUP_USER_DATA, queue: RMQ_QUEUES.USER_CLEANUP_USER_DATA },
    ]),
  ],
  providers: [TasksService],
})
export class TasksModule {}
