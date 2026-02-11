import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Request } from 'express';

import { AUTH_EVENTS } from '@/common/constants/auth.constants';
import { BaseEventProvider } from '@/common/providers/base-event.provider';
import anonymizeIp from '@/common/utils/anonymizeIp';
import { getUserAgentFromHeaders } from '@/common/utils/getUserAgentFromHeaders';
import { AuditEventType, AuditSeverity, Prisma } from '@/generated/prisma';

interface AuditRequestInput {
  readonly eventType: AuditEventType;
  readonly severity: AuditSeverity;
  readonly userId?: string | null;
  readonly statusCode: number | null;
  readonly errorCode?: string;
  readonly message: Prisma.InputJsonValue;
  readonly metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditLogProvider extends BaseEventProvider {
  constructor(eventEmitter: EventEmitter2) {
    super(eventEmitter, AuditLogProvider.name);
  }

  auditRequest(data: AuditRequestInput, request?: Request): void {
    if (!request) {
      this.safeEmit(AUTH_EVENTS.AUDIT_LOG, {
        ...data,
        userId: data.userId ?? null,
        requestId: null,
        ipAddress: null,
        userAgent: null,
        path: null,
        method: null,
      });
      return;
    }

    const { id, headers, user, path = 'N/A', method = 'N/A', ip } = request;
    const userAgent = headers && getUserAgentFromHeaders(headers);

    this.safeEmit(AUTH_EVENTS.AUDIT_LOG, {
      ...data,
      userId: data.userId ?? user?.userId ?? null,
      requestId: id ?? null,
      ipAddress: ip ? anonymizeIp(ip) : null,
      userAgent,
      path,
      method,
    });
  }
}
