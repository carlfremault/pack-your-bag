import { THROTTLE_LIMITS as COMMON_THROTTLE_LIMITS } from '@repo/nestjs-common';

// Throttling
export const THROTTLE_TTL_MS = 60000;
export const THROTTLE_LIMITS = {
  ...COMMON_THROTTLE_LIMITS,
  TEST: 5,
} as const;
