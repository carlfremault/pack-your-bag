// Product
export const NAME_MAX_LENGTH = 128;
export const DESCRIPTION_MAX_LENGTH = 1000;
export const COLOR_CODE_MAX_LENGTH = 64; // TODO: decide on color code implementation. Custom strings or rgb/hex/etc.

// Throttling
export const THROTTLE_TTL_MS = 60000;
export const THROTTLE_LIMITS = {
  TEST: 5,
  ITEMS: {
    GET_ALL: 60,
    GET: 20,
    POST: 10,
    PATCH: 20,
    DELETE: 5,
    GET_DELETE_IMPACT: 5,
  },
  CATEGORIES: {
    GET_ALL: 60,
    GET: 20,
    POST: 10,
    PATCH: 20,
    DELETE: 5,
    GET_DELETE_IMPACT: 5,
  },
} as const;
