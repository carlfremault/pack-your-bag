import { DynamicModule, Module } from '@nestjs/common';

import { RMQ_PUBLISHERS, RMQ_QUEUES } from '../rmq/rmq.constants';
import { RmqPublisherModule } from '../rmq/rmq-publisher.module';

import { AUDIT_SOURCE, AuditLogProvider } from './audit-log.provider';

export interface AuditLogModuleOptions {
  source: string;
}

@Module({})
export class AuditLogModule {
  static forRoot(options: AuditLogModuleOptions): DynamicModule {
    return {
      module: AuditLogModule,
      global: true,
      imports: [
        RmqPublisherModule.register([{ name: RMQ_PUBLISHERS.AUDIT, queue: RMQ_QUEUES.AUDIT }]),
      ],
      providers: [{ provide: AUDIT_SOURCE, useValue: options.source }, AuditLogProvider],
      exports: [AuditLogProvider],
    };
  }
}
