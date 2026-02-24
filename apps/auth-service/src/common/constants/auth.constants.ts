// Password
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
export const PASSWORD_MESSAGE =
  'Password must contain at least one uppercase letter, one lowercase letter, one number, and be at least 8 characters long. Special characters are allowed';
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MIN_LENGTH_MESSAGE = `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_MAX_LENGTH_MESSAGE = `Password must not exceed ${PASSWORD_MAX_LENGTH} characters.`;

// User
export const AUTH_DEFAULT_USER_ROLE_ID = 1; // "user"
export const DEFAULT_LOCALE = 'en-GB';
export const LOCALE_REGEX = /^[a-z]{2}(-[A-Z]{2})?$/;
export const LOCALE_MESSAGE = 'Locale must be a valid format (e.g., en, en-GB)';

// Events
export const AUTH_EVENTS = {
  AUDIT_LOG: 'audit.log',
  PASSWORD_RESET_REQUESTED: 'password.reset_requested',
  PASSWORD_RESET_CONFIRMED: 'password.reset_confirmed',
  ACCOUNT_DELETION_REQUESTED: 'account.deletion_requested',
} as const;

// Various
export const EMAIL_MAX_LENGTH = 254;
