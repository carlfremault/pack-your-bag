'use client';

import { useActionState } from 'react';
import Link from 'next/link';

import { Alert } from '@repo/react-common/alert';
import { LinkButton, SubmitButton } from '@repo/react-common/button';
import { Input, PasswordInput } from '@repo/react-common/input';

import { loginAction, type LoginState } from '../actions';

export default function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.formError && <Alert type="error" message={state.formError} />}
      <Input
        label="Email"
        name="email"
        required
        defaultValue={state?.values?.email}
        errorMessage={state?.fieldErrors?.email}
      />
      <PasswordInput
        label="Password"
        name="password"
        required
        errorMessage={state?.fieldErrors?.password}
      />
      <div className="flex items-end justify-between">
        <LinkButton href="/password-forgotten" variant="link" linkAs={Link} className="text-xs">
          Password forgotten?
        </LinkButton>
        <div className="flex items-center justify-end gap-2">
          <LinkButton href="/register" variant="outline" linkAs={Link}>
            Sign up
          </LinkButton>
          <SubmitButton pending={pending}>Sign in</SubmitButton>
        </div>
      </div>
    </form>
  );
}
