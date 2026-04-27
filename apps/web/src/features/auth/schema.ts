import { schemas } from '@repo/auth-client';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MAX_LENGTH_MESSAGE,
  PASSWORD_MESSAGE,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MIN_LENGTH_MESSAGE,
  PASSWORD_REGEX,
} from '@repo/constants';

import { z } from 'zod';

const passwordField = z
  .string()
  .min(PASSWORD_MIN_LENGTH, PASSWORD_MIN_LENGTH_MESSAGE)
  .max(PASSWORD_MAX_LENGTH, PASSWORD_MAX_LENGTH_MESSAGE)
  .regex(PASSWORD_REGEX, PASSWORD_MESSAGE);

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
export const updatePasswordSchema = schemas.UpdatePasswordDto.extend({
  newPassword: passwordField,
  confirmPassword: passwordField,
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});
export const resetPasswordSchema = schemas.AuthResetPasswordDto.extend({
  password: passwordField,
  confirmPassword: passwordField,
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});
export const deleteAccountSchema = schemas.DeleteUserDto;
