'use client';
import { useActionState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { SubmitButton } from '@repo/react-common/button';
import { InputPassword } from '@repo/react-common/input';

import classNames from 'classnames';

import { updatePasswordAction, UpdatePasswordState } from '../actions';

export interface PasswordUpdateFormProps {
  disabled?: boolean;
}

export default function PasswordUpdateForm({ disabled = false }: PasswordUpdateFormProps) {
  const [state, formAction, pending] = useActionState<UpdatePasswordState, FormData>(
    updatePasswordAction,
    null,
  );

  useEffect(() => {
    if (state?.formError) {
      toast.error(state.formError);
    }

    if (state?.success) {
      toast.success('Password updated');
    }
  }, [state]);

  return (
    <form
      action={formAction}
      className={classNames(
        'bg-surface border-primary-ring flex w-full flex-col gap-4 rounded-md border p-4 shadow-sm transition-opacity',
        (pending || disabled) && 'opacity-50',
      )}
      aria-disabled={disabled}
    >
      <fieldset disabled={disabled} className="min-w-0">
        <div className="flex flex-col gap-4">
          {disabled && (
            <p className="text-primary/70 text-sm italic">
              Sign up for a full account to change your password.
            </p>
          )}
          <InputPassword
            label="Current Password"
            name="currentPassword"
            required
            errorMessage={state?.fieldErrors?.currentPassword}
          />
          <InputPassword
            label="New Password"
            name="newPassword"
            required
            errorMessage={state?.fieldErrors?.newPassword}
          />
          <InputPassword
            label="Confirm New Password"
            name="confirmPassword"
            required
            errorMessage={state?.fieldErrors?.confirmPassword}
          />
          <div className="flex justify-end">
            <SubmitButton pending={pending}>Confirm</SubmitButton>
          </div>
        </div>
      </fieldset>
    </form>
  );
}
