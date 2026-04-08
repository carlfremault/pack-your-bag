'use client';

import { useActionState } from 'react';

import { Alert } from '@repo/react-common/alert';
import { Button, LinkButton } from '@repo/react-common/button';
import { Input, PasswordInput } from '@repo/react-common/input';

import Link from 'next/link';

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
      <PasswordInput
        label="Password"
        name="password"
        required
        errorMessage={state?.fieldErrors?.password}
      />
      <PasswordInput
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
          <Button type="submit" disabled={pending}>
            {pending ? 'Signing up...' : 'Sign up'}
          </Button>
        </div>
      </div>
    </form>
  );
}
