'use client';

import { useActionState } from 'react';

import { Alert, Button, Input, PasswordInput } from '@repo/react-common';

import { loginAction, type LoginState } from '../actions';

export default function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.formError && <Alert message={state.formError} />}
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
      <Button type="submit" disabled={pending} className="self-end">
        {pending ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  );
}
