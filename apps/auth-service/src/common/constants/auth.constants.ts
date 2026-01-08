export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
export const PASSWORD_MESSAGE =
  'Password must contain at least one uppercase letter, one lowercase letter, one number, and be at least 8 characters long. Special characters are allowed';
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MIN_LENGTH_MESSAGE = `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_MAX_LENGTH_MESSAGE = `Password must not exceed ${PASSWORD_MAX_LENGTH} characters.`;
