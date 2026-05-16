'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Alert } from '@repo/react-common/alert';
import { LinkButton, SubmitButton } from '@repo/react-common/button';
import { Input, InputPassword } from '@repo/react-common/input';

import { registerSchema } from '../schema';

interface RegisterFormProps {
  error?: string;
  email?: string;
}

export default function RegisterForm({ error, email }: RegisterFormProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState(error);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    const formData = new FormData(form);
    const values = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    };

    const parsed = registerSchema.safeParse(values);
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

    // Prevent immediate navigation so password manager extensions have time
    // to capture credentials and message their service worker before the
    // page unloads (required for Chrome MV3 / Bitwarden).
    // e.preventDefault();
    // setFieldErrors({});
    // setFormError(undefined);
    setIsSubmitting(true);
    // setTimeout(() => form.submit(), 150);
  };

  return (
    <form
      method="POST"
      action="/api/auth/register"
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
    >
      {formError && <Alert message={formError} />}
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
        autoComplete="new-password"
        required
        errorMessage={fieldErrors.password}
      />
      <InputPassword
        label="Confirm Password"
        name="confirmPassword"
        autoComplete="new-password"
        required
        errorMessage={fieldErrors.confirmPassword}
      />
      <div className="flex items-end justify-between">
        <LinkButton href="/policy" variant="link" linkAs={Link} className="text-xs">
          Terms & Privacy Policy
        </LinkButton>
        <div className="flex items-center justify-end gap-2">
          <LinkButton href="/login" variant="outline" linkAs={Link}>
            Sign in
          </LinkButton>
          <SubmitButton pending={isSubmitting}>Sign up</SubmitButton>
        </div>
      </div>
    </form>
  );
}
