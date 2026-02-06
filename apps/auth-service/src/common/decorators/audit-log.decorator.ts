import { SetMetadata } from '@nestjs/common';

import { AuditEventType } from '@prisma-client';

export const AUDIT_EVENT_KEY = 'audit_event';
export const AuditLog = (eventType: AuditEventType) => SetMetadata(AUDIT_EVENT_KEY, eventType);
