'use server';

import { redirect } from 'next/navigation';

import { ApiError } from '@/lib/errors';
import { getSession } from '@/lib/session';

import {
  cancelDeletion,
  deleteAccount,
  logout,
  logoutAll,
  passwordForgotten,
  resendVerificationEmail,
} from './api';
import {
  cancelDeletionSchema,
  deleteAccountSchema,
  passwordForgottenSchema,
  resendVerificationEmailSchema,
} from './schema';

// ============================================
// LOGOUT
// ============================================

export async function logoutAction() {
  const session = await getSession();

  try {
    await logout();
  } catch {
    // Best-effort: destroy the local session regardless of the upstream call
  }

  session.destroy();
  redirect('/login');
}

// ============================================
// LOGOUT ALL DEVICES
// ============================================

export async function logoutAllAction() {
  const session = await getSession();

  try {
    await logoutAll();
  } catch {
    // Best-effort: destroy the local session regardless of the upstream call
  }

  session.destroy();
  redirect('/login');
}

// ============================================
// PASSWORD FORGOTTEN
// ============================================

export type PasswordForgottenState = {
  fieldErrors?: {
    email?: string;
  };
  formError?: string;
  success?: boolean;
  values?: {
    email?: string;
  };
} | null;

export async function passwordForgottenAction(
  _prevState: PasswordForgottenState,
  formData: FormData,
): Promise<PasswordForgottenState> {
  const raw = { email: formData.get('email') as string | null };
  const values = { email: raw.email ?? '' };

  const parsed = passwordForgottenSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: NonNullable<PasswordForgottenState>['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === 'email') {
        fieldErrors[field] ??= issue.message;
      }
    }
    return { fieldErrors, values };
  }

  try {
    await passwordForgotten(parsed.data);
  } catch (e) {
    return { formError: e instanceof ApiError ? e.message : 'Something went wrong', values };
  }

  return { success: true };
}

// ============================================
// EMAIL VERIFICATION
// ============================================

export type ResendVerificationEmailState = {
  fieldErrors?: {
    email?: string;
  };
  formError?: string;
  success?: boolean;
  values?: {
    email?: string;
  };
} | null;

export async function resendVerificationEmailAction(
  _prevState: ResendVerificationEmailState,
  formData: FormData,
): Promise<ResendVerificationEmailState> {
  const raw = { email: formData.get('email') as string | null };
  const values = { email: raw.email ?? '' };

  const parsed = resendVerificationEmailSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: NonNullable<ResendVerificationEmailState>['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === 'email') {
        fieldErrors[field] ??= issue.message;
      }
    }
    return { fieldErrors, values };
  }

  try {
    await resendVerificationEmail(parsed.data);
  } catch (e) {
    return { formError: e instanceof ApiError ? e.message : 'Something went wrong', values };
  }

  const session = await getSession();
  session.pendingVerificationEmail = undefined;
  await session.save();

  return { success: true };
}

// ============================================
// DELETE ACCOUNT
// ============================================

export type DeleteAccountState = {
  fieldErrors?: {
    password?: string;
  };
  formError?: string;
} | null;
export async function deleteAccountAction(
  locale: string | undefined,
  _prevState: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const raw = {
    password: formData.get('password') as string | null,
    locale,
  };

  const parsed = deleteAccountSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: NonNullable<DeleteAccountState>['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === 'password') {
        fieldErrors[field] ??= issue.message;
      }
    }
    return { fieldErrors };
  }

  const session = await getSession();

  try {
    await deleteAccount(parsed.data);
  } catch (e) {
    return { formError: e instanceof ApiError ? e.message : 'Something went wrong' };
  }

  session.destroy();
  redirect('/login');
}

// ============================================
// CANCEL ACCOUNT DELETION
// ============================================

export type CancelAccountDeletionState = {
  fieldErrors?: {
    password?: string;
  };
  formError?: string;
  success?: boolean;
} | null;

export async function cancelAccountDeletionAction(
  token: string,
  _prevState: CancelAccountDeletionState,
  formData: FormData,
): Promise<CancelAccountDeletionState> {
  const raw = {
    token,
    password: formData.get('password') as string | null,
  };

  const parsed = cancelDeletionSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: NonNullable<CancelAccountDeletionState>['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === 'password') {
        fieldErrors[field] ??= issue.message;
      }
    }
    return { fieldErrors };
  }

  try {
    await cancelDeletion(parsed.data);
  } catch (e) {
    return { formError: e instanceof ApiError ? e.message : 'Something went wrong' };
  }

  return { success: true };
}
