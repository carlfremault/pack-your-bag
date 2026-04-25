import { CATEGORY_NAME_MAX_LENGTH, DESCRIPTION_MAX_LENGTH, NAME_MAX_LENGTH } from '@repo/constants';

export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please sign in again.';

// Item Dto
export const ITEM_NAME_MAX_LENGTH = NAME_MAX_LENGTH;
export const ITEM_DESCRIPTION_MAX_LENGTH = DESCRIPTION_MAX_LENGTH;

// Category Dto
export { CATEGORY_NAME_MAX_LENGTH };

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
