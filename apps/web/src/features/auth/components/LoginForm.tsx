'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Alert } from '@repo/react-common/alert';
import { LinkButton, SubmitButton } from '@repo/react-common/button';
import { Input, InputPassword } from '@repo/react-common/input';

import { loginSchema } from '../schema';

interface LoginFormProps {
  error?: string;
  email?: string;
}

export default function LoginForm({ error, email }: LoginFormProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState(error);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    const formData = new FormData(form);
    const values = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      e.preventDefault();
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as string;
        errors[field] ??= issue.message;
      }
      setFieldErrors(errors);
      setFormError(undefined);
      return;
    }
    setIsSubmitting(true);
  };

  return (
    <form
      method="POST"
      action="/api/auth/login"
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
    >
      {formError && <Alert type="error" message={formError} />}
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="username"
        required
        defaultValue={email}
        errorMessage={fieldErrors.email}
      />
      <InputPassword
        label="Password"
        name="password"
        autoComplete="current-password"
        required
        errorMessage={fieldErrors.password}
      />
      <div className="flex items-end justify-between">
        <LinkButton href="/password-forgotten" variant="link" linkAs={Link} className="text-xs">
          Password forgotten?
        </LinkButton>
        <div className="flex items-center justify-end gap-2">
          <LinkButton href="/register" variant="outline" linkAs={Link}>
            Sign up
          </LinkButton>
          <SubmitButton pending={isSubmitting}>Sign in</SubmitButton>
        </div>
      </div>
    </form>
  );
}
