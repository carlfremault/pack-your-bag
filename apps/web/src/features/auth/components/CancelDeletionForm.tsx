'use client';

import { useActionState } from 'react';
import Link from 'next/link';

import { Alert } from '@repo/react-common/alert';
import { LinkButton, SubmitButton } from '@repo/react-common/button';
import { InputPassword } from '@repo/react-common/input';

import { cancelAccountDeletionAction, CancelAccountDeletionState } from '../actions';

export type CancelDeletionFormProps = {
  token: string;
};

export default function CancelDeletionForm(props: CancelDeletionFormProps) {
  const { token } = props;
  const boundAction = cancelAccountDeletionAction.bind(null, token);
  const [state, formAction, pending] = useActionState<CancelAccountDeletionState, FormData>(
    boundAction,
    null,
  );

  if (state?.success) {
    return (
      <div className="flex flex-col gap-4">
        <Alert
          type="success"
          message="Your account deletion request has been cancelled, your account is restored. You can now sign in again."
        />
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
        label="Password"
        name="password"
        required
        errorMessage={state?.fieldErrors?.password}
      />
      <div className="flex items-center justify-end">
        <SubmitButton pending={pending}>Confirm</SubmitButton>
      </div>
    </form>
  );
}
