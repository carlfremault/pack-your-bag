export const RMQ_QUEUES = {
  AUDIT: 'audit_events',
  SEED: 'seed_guest_data',
} as const;

export const RMQ_PUBLISHERS = {
  AUDIT: 'RMQ_AUDIT_PUBLISHER',
  SEED: 'RMQ_SEED_PUBLISHER',
} as const;

export const RMQ_PATTERNS = {
  AUDIT_LOG_CREATED: 'audit.log.created',
  AUDIT_LOGS_ANONYMIZE: 'audit.logs.anonymize',
  SEED_GUEST_DATA: 'seed.guest_data',
} as const;
