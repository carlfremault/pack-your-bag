export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please sign in again.';

// Item Dto
export const ITEM_NAME_MAX_LENGTH = 128;
export const ITEM_DESCRIPTION_MAX_LENGTH = 1000;

// Category Dto
export const CATEGORY_NAME_MAX_LENGTH = 64;

// Routes that require no session. Matched as path prefixes.
export const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/register-success',
  '/policy',
  '/password-forgotten',
  '/verify-email',
  '/email-not-verified',
];

// Public routes where authenticated users should be redirected to /items.
export const AUTH_REDIRECT_PATHS = [
  '/login',
  '/register',
  '/register-success',
  '/password-forgotten',
  '/verify-email',
  '/email-not-verified',
];
