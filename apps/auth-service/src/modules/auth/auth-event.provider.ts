import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { AUTH_EVENTS } from '@/common/constants/auth.constants';
import { BaseEventProvider } from '@/common/providers/base-event.provider';

export interface PasswordResetRequestedEvent {
  userId: string;
  email: string;
  resetToken: string;
}

export interface PasswordResetConfirmedEvent {
  userId: string;
  email: string;
  resetTimestamp: string;
}

@Injectable()
export class AuthEventProvider extends BaseEventProvider {
  constructor(eventEmitter: EventEmitter2) {
    super(eventEmitter, AuthEventProvider.name);
  }

  emitPasswordResetRequested(data: PasswordResetRequestedEvent): void {
    this.safeEmit(AUTH_EVENTS.PASSWORD_RESET_REQUESTED, data);
  }

  emitPasswordResetConfirmed(data: PasswordResetConfirmedEvent): void {
    this.safeEmit(AUTH_EVENTS.PASSWORD_RESET_CONFIRMED, data);
  }
}
