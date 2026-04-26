// Password
export { PASSWORD_REGEX, PASSWORD_MESSAGE } from '@repo/constants';

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
  ACCOUNT_VERIFICATION_REQUESTED: 'account.verification_requested',
  ACCOUNT_DELETION_REQUESTED: 'account.deletion_requested',
} as const;

// Throttling
export const THROTTLE_TTL_MS = 60000;
export const THROTTLE_LIMITS = {
  REGISTER: 5,
  LOGIN: 10,
  REFRESH_TOKEN: 5,
  LOGOUT: 5,
  LOGOUT_ALL_DEVICES: 3,
  UPDATE_PASSWORD: 3,
  DELETE_USER: 3,
  FORGOT_PASSWORD: 3,
  RESET_PASSWORD: 3,
  VERIFY_EMAIL: 3,
  RESEND_VERIFICATION_EMAIL: 5,
  CANCEL_ACCOUNT_DELETION: 3,
} as const;

// Various
export const EMAIL_MAX_LENGTH = 254;
