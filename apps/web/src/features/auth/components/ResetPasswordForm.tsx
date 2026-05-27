'use client';

import { useActionState } from 'react';
import Link from 'next/link';

import { Alert } from '@repo/react-common/alert';
import { LinkButton, SubmitButton } from '@repo/react-common/button';
import { InputPassword } from '@repo/react-common/input';

import { resetPasswordAction, ResetPasswordState } from '../actions';

interface ResetPasswordFormProps {
  token: string;
  locale?: string;
}

export default function ResetPasswordForm(props: ResetPasswordFormProps) {
  const { token, locale } = props;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const boundAction = resetPasswordAction.bind(null, token, locale, timezone);
  const [state, formAction, pending] = useActionState<ResetPasswordState, FormData>(
    boundAction,
    null,
  );

  if (state?.success) {
    return (
      <div className="flex flex-col gap-4">
        <Alert type="success" message="Your password has been reset. You can now sign in." />
        <LinkButton href="/login" variant="outline" linkAs={Link} className="self-end">
          Back to login
        </LinkButton>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.formError && <Alert type="error" message={state.formError} />}
      <InputPassword
        label="New Password"
        name="password"
        required
        errorMessage={state?.fieldErrors?.password}
      />
      <InputPassword
        label="Confirm Password"
        name="confirmPassword"
        required
        errorMessage={state?.fieldErrors?.confirmPassword}
      />
      <div className="flex items-center justify-end gap-2">
        <LinkButton href="/login" variant="outline" linkAs={Link}>
          Back to login
        </LinkButton>
        <SubmitButton pending={pending}>Confirm</SubmitButton>
      </div>
    </form>
  );
}
