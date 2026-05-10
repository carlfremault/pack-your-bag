'use client';

import { useActionState } from 'react';
import Link from 'next/link';

import { Alert } from '@repo/react-common/alert';
import { LinkButton, SubmitButton } from '@repo/react-common/button';
import { Input } from '@repo/react-common/input';

import { passwordForgottenAction, type PasswordForgottenState } from '../actions';

export default function PasswordForgottenForm() {
  const [state, formAction, pending] = useActionState<PasswordForgottenState, FormData>(
    passwordForgottenAction,
    null,
  );

  if (state?.success) {
    return (
      <div className="flex flex-col gap-4">
        <Alert
          type="success"
          message="If an account with this email address exists, a reset link has been sent. The link remains valid for 15 minutes. Please check your inbox or spam folder."
        />
        <LinkButton href="/login" variant="outline" linkAs={Link} className="self-end">
          Back to login
        </LinkButton>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.formError && <Alert type="error" message={state.formError} />}
      <Input
        label="Email"
        name="email"
        type="email"
        required
        defaultValue={state?.values?.email}
        errorMessage={state?.fieldErrors?.email}
      />
      <div className="flex items-center justify-end gap-2">
        <LinkButton href="/login" variant="outline" linkAs={Link}>
          Back to login
        </LinkButton>
        <SubmitButton pending={pending}>Submit</SubmitButton>
      </div>
    </form>
  );
}
