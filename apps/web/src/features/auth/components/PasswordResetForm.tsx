'use client';

import { useActionState } from 'react';

import { Alert } from '@repo/react-common/alert';
import { Button, LinkButton } from '@repo/react-common/button';
import { Input } from '@repo/react-common/input';

import Link from 'next/link';

import { passwordResetAction, type PasswordResetState } from '../actions';

export default function PasswordResetForm() {
  const [state, formAction, pending] = useActionState<PasswordResetState, FormData>(
    passwordResetAction,
    null,
  );

  if (state?.success) {
    return (
      <div className="flex flex-col gap-4">
        <Alert
          type="success"
          message="If an account with this email address exists, a reset link has been sent. Please check your inbox or spam folder."
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
        <Button type="submit" disabled={pending} className="self-end">
          {pending ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </form>
  );
}
