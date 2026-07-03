export const RMQ_QUEUES = {
  AUDIT: 'audit_events',
  SEED: 'seed_guest_data',
  USER_CLEANUP_PRODUCT: 'user_cleanup_product',
  USER_CLEANUP_USER_DATA: 'user_cleanup_user_data',
} as const;

export const RMQ_PUBLISHERS = {
  AUDIT: 'RMQ_AUDIT_PUBLISHER',
  SEED: 'RMQ_SEED_PUBLISHER',
  USER_CLEANUP_PRODUCT: 'RMQ_USER_CLEANUP_PRODUCT_PUBLISHER',
  USER_CLEANUP_USER_DATA: 'RMQ_USER_CLEANUP_USER_DATA_PUBLISHER',
} as const;

export const RMQ_PATTERNS = {
  AUDIT_LOG_CREATED: 'audit.log.created',
  AUDIT_LOGS_ANONYMIZE: 'audit.logs.anonymize',
  SEED_GUEST_DATA: 'seed.guest_data',
  USER_CLEANUP_PRODUCT_REQUESTED: 'user.cleanup.product',
  USER_CLEANUP_USER_DATA_REQUESTED: 'user.cleanup.user_data',
} as const;
