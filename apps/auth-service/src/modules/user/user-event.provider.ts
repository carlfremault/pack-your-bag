import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { AUTH_EVENTS } from '@/common/constants/auth.constants';
import { BaseEventProvider } from '@/common/providers/base-event.provider';

export interface AccountDeletionRequestedEvent {
  userId: string;
  email: string;
  cancellationToken: string;
  cancellationDate: string;
}

@Injectable()
export class UserEventProvider extends BaseEventProvider {
  constructor(eventEmitter: EventEmitter2) {
    super(eventEmitter, UserEventProvider.name);
  }

  emitAccountDeletionRequested(data: AccountDeletionRequestedEvent): void {
    this.safeEmit(AUTH_EVENTS.ACCOUNT_DELETION_REQUESTED, data);
  }
}
