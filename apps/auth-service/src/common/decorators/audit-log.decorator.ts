import { SetMetadata } from '@nestjs/common';

import { AuditLogEventType } from '@repo/db';

export const AUDIT_EVENT_KEY = 'audit_event';
export const AuditLog = (eventType: AuditLogEventType) => SetMetadata(AUDIT_EVENT_KEY, eventType);
