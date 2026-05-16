'use client';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { Button } from '@repo/react-common/button';
import { InputPassword } from '@repo/react-common/input';
import { Spinner } from '@repo/react-common/spinner';

import classNames from 'classnames';

import { updatePasswordSchema } from '../schema';

export interface PasswordUpdateFormProps {
  error?: string;
  success?: string;
}

export default function PasswordUpdateForm(props: PasswordUpdateFormProps) {
  const { error, success } = props;

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleClick = () => {
    const form = formRef.current;
    if (!form) return;

    const formData = new FormData(form);
    const values = {
      currentPassword: formData.get('currentPassword') as string,
      newPassword: formData.get('newPassword') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    };

    const parsed = updatePasswordSchema.safeParse(values);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as string;
        errors[field] ??= issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    // requestSubmit fires the submit event (Bitwarden detects it) only when validation passes
    form.requestSubmit();
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
      window.history.replaceState({}, '', '/settings');
    }

    if (success) {
      toast.success('Password updated');
      window.history.replaceState({}, '', '/settings');
    }
  }, [error, success]);

  return (
    <form
      ref={formRef}
      method="POST"
      action="/api/account/update-password"
      className={classNames(
        'bg-surface border-primary-ring flex w-full flex-col gap-4 rounded-md border p-4 shadow-sm transition-opacity',
        isSubmitting && 'opacity-50',
      )}
    >
      <InputPassword
        label="Current Password"
        name="currentPassword"
        autoComplete="current-password"
        required
        errorMessage={fieldErrors?.currentPassword}
      />
      <InputPassword
        label="New Password"
        name="newPassword"
        autoComplete="new-password"
        required
        errorMessage={fieldErrors?.newPassword}
      />
      <InputPassword
        label="Confirm New Password"
        name="confirmPassword"
        autoComplete="new-password"
        required
        errorMessage={fieldErrors?.confirmPassword}
      />
      <div className="flex justify-end">
        <Button type="button" aria-label="Confirm" disabled={isSubmitting} onClick={handleClick}>
          <span className="relative inline-flex items-center justify-center leading-none">
            <span className={isSubmitting ? 'invisible' : ''}>Confirm</span>
            {isSubmitting && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Spinner size="small" color="surface" className="translate-y-px" />
              </span>
            )}
          </span>
        </Button>
      </div>
    </form>
  );
}
