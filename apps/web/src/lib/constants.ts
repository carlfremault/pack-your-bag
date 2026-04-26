export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please sign in again.';

// Routes that require no session. Matched as path prefixes.
export const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/register-success',
  '/policy',
  '/password-forgotten',
  '/verify-email',
  '/email-not-verified',
  '/reset-password',
];

// Public routes where authenticated users should be redirected to /items.
export const AUTH_REDIRECT_PATHS = [
  '/login',
  '/register',
  '/register-success',
  '/password-forgotten',
  '/verify-email',
  '/email-not-verified',
  '/reset-password',
];
