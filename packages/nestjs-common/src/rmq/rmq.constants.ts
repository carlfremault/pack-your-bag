export const RMQ_QUEUES = {
  AUDIT: 'audit_events',
} as const;

export const RMQ_PUBLISHERS = {
  AUDIT: 'RMQ_AUDIT_PUBLISHER',
} as const;

export const RMQ_PATTERNS = {
  AUDIT_LOG_CREATED: 'audit.log.created',
  AUDIT_LOGS_ANONYMIZE: 'audit.logs.anonymize',
} as const;
