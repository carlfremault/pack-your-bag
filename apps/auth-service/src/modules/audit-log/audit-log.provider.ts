import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import type { AuditLogData } from '@/common/interfaces/audit-log-data.interface';

@Injectable()
export class AuditLogProvider {
  private readonly logger = new Logger(AuditLogProvider.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Dispatches an audit log event safely.
   * Uses setImmediate to ensure it doesn't block the main execution thread
   * and wraps in try/catch to protect the caller.
   */
  safeEmit(data: AuditLogData): void {
    setImmediate(() => {
      try {
        this.eventEmitter.emit('audit.log', data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : undefined;

        this.logger.error(
          `Failed to dispatch audit event for userId=${data.userId}: ${errorMessage}`,
          stack,
        );
      }
    });
  }
}
