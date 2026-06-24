import { Module } from '@nestjs/common';

import { RMQ_PUBLISHERS, RMQ_QUEUES, RmqPublisherModule } from '@repo/nestjs-common';

import { AuditLogProvider } from './audit-log.provider';

@Module({
  imports: [RmqPublisherModule.register([{ name: RMQ_PUBLISHERS.AUDIT, queue: RMQ_QUEUES.AUDIT }])],
  providers: [AuditLogProvider],
  exports: [AuditLogProvider],
})
export class AuditLogModule {}
