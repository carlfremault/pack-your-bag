'use client';

import { useActionState } from 'react';

import Alert from '@/components/ui/alert';
import Button from '@/components/ui/buttons/button';

type LoginState = { error?: string | string[] } | null;

interface LoginFormProps {
  handleLogin: (state: LoginState, formData: FormData) => Promise<LoginState>;
}

export default function LoginForm(props: LoginFormProps) {
  const { handleLogin } = props;

  const [state, action, pending] = useActionState(handleLogin, null as LoginState);

  return (
    <form action={action} className="flex flex-col gap-2">
      {state?.error && <Alert message={state.error} />}
      <label htmlFor="email" className="sr-only">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        className="rounded-md border border-gray-300 p-2"
        placeholder="Email"
      />
      <label htmlFor="password" className="sr-only">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        className="rounded-md border border-gray-300 p-2"
        placeholder="Password"
      />
      <Button type="submit" disabled={pending}>
        {pending ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  );
}
