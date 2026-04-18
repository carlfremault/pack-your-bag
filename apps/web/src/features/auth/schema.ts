import { schemas } from '@repo/auth-client';

import { z } from 'zod';

// This needs to be aligned with the password validation in the auth-service
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const passwordField = z
  .string()
  .min(8)
  .max(128)
  .regex(
    PASSWORD_REGEX,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and be at least 8 characters long. Special characters are allowed.',
  );

export const loginSchema = schemas.AuthCredentialsDto.extend({
  password: passwordField,
});
export const registerSchema = loginSchema
  .extend({
    confirmPassword: z.string().min(1, 'Confirm password is required.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });
export const passwordForgottenSchema = schemas.AuthForgotPasswordDto;
export const resendVerificationEmailSchema = schemas.AuthResendVerificationEmailDto;
