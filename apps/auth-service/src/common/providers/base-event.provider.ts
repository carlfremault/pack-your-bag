import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export abstract class BaseEventProvider {
  protected readonly logger: Logger;

  constructor(
    protected readonly eventEmitter: EventEmitter2,
    loggerContext: string,
  ) {
    this.logger = new Logger(loggerContext, { timestamp: true });
  }

  protected safeEmit(event: string, data: unknown): void {
    setImmediate(() => {
      try {
        this.eventEmitter.emit(event, data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : undefined;

        this.logger.error(`Failed to emit event '${event}': ${errorMessage}`, stack);
      }
    });
  }
}
