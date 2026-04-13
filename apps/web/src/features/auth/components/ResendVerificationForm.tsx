'use client';

import { useActionState } from 'react';

import { Alert } from '@repo/react-common/alert';
import { Button, LinkButton } from '@repo/react-common/button';
import { Input } from '@repo/react-common/input';

import Link from 'next/link';

import { resendVerificationEmailAction, type ResendVerificationEmailState } from '../actions';

export type ResendVerificationFormProps = {
  prefillEmail?: string;
};

export default function ResendVerificationForm(props: ResendVerificationFormProps) {
  const { prefillEmail } = props;

  const [state, formAction, pending] = useActionState<ResendVerificationEmailState, FormData>(
    resendVerificationEmailAction,
    null,
  );

  if (state?.success) {
    return (
      <div className="flex flex-col gap-4">
        <Alert
          type="success"
          message="If an unverified account with this email address exists, a verification email has been sent. Please check your inbox or spam folder. The link remains valid for 1 hour."
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
      {!prefillEmail && (
        <div className="flex flex-col gap-2">
          <p className="text-primary text-sm">
            Please enter your email address to resend the verification email. The link remains valid
            for 1 hour. Don&apos;t forget to check your spam folder.
          </p>
          <Input label="Email" name="email" type="email" required />
        </div>
      )}
      {prefillEmail && <input type="hidden" name="email" value={prefillEmail} />}
      <div className="flex items-center justify-end gap-2">
        <LinkButton href="/login" variant="outline" linkAs={Link}>
          Back to login
        </LinkButton>
        <Button type="submit" disabled={pending}>
          {pending ? 'Resending...' : 'Resend verification email'}
        </Button>
      </div>
    </form>
  );
}
