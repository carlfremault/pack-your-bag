import { z } from 'zod';

export const AuthCredentialsDto = z
  .object({
    email: z.string().min(1).max(254).email(),
    password: z
      .string()
      .min(8)
      .max(128)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/),
  })
  .passthrough();
export const AuthResponseDto = z
  .object({
    access_token: z.string(),
    refresh_token: z.string(),
    token_type: z.string(),
    expires_in: z.number(),
    user: z.object({ id: z.string(), role: z.number() }).partial().passthrough(),
  })
  .passthrough();
export const UpdatePasswordDto = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z
      .string()
      .min(8)
      .max(128)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/),
  })
  .passthrough();
export const AuthForgotPasswordDto = z
  .object({ email: z.string().min(1).max(254).email() })
  .passthrough();
export const AuthResetPasswordDto = z
  .object({
    token: z.string().min(1),
    password: z
      .string()
      .min(8)
      .max(128)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/),
    locale: z.string().max(10).optional(),
  })
  .passthrough();
export const AuthVerifyEmailDto = z.object({ token: z.string().min(1) }).passthrough();
export const AuthResendVerificationEmailDto = z
  .object({ email: z.string().min(1).max(254).email() })
  .passthrough();
export const DeleteUserDto = z
  .object({ password: z.string().min(1), locale: z.string().max(10).optional() })
  .passthrough();
export const CancelDeletionDto = z
  .object({ token: z.string().min(1), password: z.string().min(1) })
  .passthrough();
