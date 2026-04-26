import type { RequestBody, SuccessResponse } from '@repo/auth-client';

export type LoginBody = RequestBody<'/auth/login', 'post'>;
export type LoginResponse = SuccessResponse<'/auth/login', 'post'>;
export type RegisterBody = RequestBody<'/auth/register', 'post'>;
export type PasswordForgottenBody = RequestBody<'/auth/forgot-password', 'post'>;
export type ResendVerificationEmailBody = RequestBody<'/auth/resend-verification-email', 'post'>;
export type VerifyEmailBody = RequestBody<'/auth/verify-email', 'post'>;
export type UpdatePasswordBody = RequestBody<'/auth/update-password', 'patch'>;
export type ResetPasswordBody = RequestBody<'/auth/reset-password', 'post'>;
