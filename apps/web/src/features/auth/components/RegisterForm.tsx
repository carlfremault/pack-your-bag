'use client';

import { useActionState } from 'react';
import Link from 'next/link';

import { Alert } from '@repo/react-common/alert';
import { LinkButton, SubmitButton } from '@repo/react-common/button';
import { Input, InputPassword } from '@repo/react-common/input';

import { registerAction, type RegisterState } from '../actions';

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState<RegisterState, FormData>(
    registerAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.formError && <Alert message={state.formError} />}
      <Input
        label="Email"
        name="email"
        type="email"
        required
        defaultValue={state?.values?.email}
        errorMessage={state?.fieldErrors?.email}
      />
      <InputPassword
        label="Password"
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
      <div className="flex items-end justify-between">
        <LinkButton href="/policy" variant="link" linkAs={Link} className="text-xs">
          Terms & Privacy Policy
        </LinkButton>
        <div className="flex items-center justify-end gap-2">
          <LinkButton href="/login" variant="outline" linkAs={Link}>
            Sign in
          </LinkButton>
          <SubmitButton pending={pending}>Sign up</SubmitButton>
        </div>
      </div>
    </form>
  );
}
