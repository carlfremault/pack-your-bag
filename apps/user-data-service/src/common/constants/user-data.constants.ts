// Throttling
export const THROTTLE_TTL_MS = 60000;
export const THROTTLE_LIMITS = {
  GET: 20,
  POST: 10,
  PATCH: 20,
  DELETE: 5,
} as const;
