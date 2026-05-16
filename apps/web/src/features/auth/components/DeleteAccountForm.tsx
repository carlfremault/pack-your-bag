'use client';

import { useActionState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { Button, SubmitButton } from '@repo/react-common/button';
import { InputPassword } from '@repo/react-common/input';

import { deleteAccountAction, DeleteAccountState } from '@/features/auth/actions';

export interface DeleteAccountFormProps {
  locale?: string;
  closeModal: () => void;
}

export default function DeleteAccountForm(props: DeleteAccountFormProps) {
  const { locale, closeModal } = props;
  const boundAction = deleteAccountAction.bind(null, locale);
  const [state, formAction, pending] = useActionState<DeleteAccountState, FormData>(
    boundAction,
    null,
  );

  useEffect(() => {
    if (state?.formError) {
      toast.error(state.formError);
    }
  }, [state]);

  return (
    <div className="flex flex-col gap-4">
      <div id="modal-description" className="flex flex-col gap-4">
        <p className="text-primary font-bold">We&apos;re sorry to see you go!</p>
        <p className="text-primary">Confirming deletion will:</p>
        <ul className="text-primary list-inside list-disc">
          <li>Log you out of the application immediately</li>
          <li>
            Deactivate your account for a <strong>30-day grace period</strong>
          </li>
          <li>Permanently erase your account and all your data after those 30 days</li>
        </ul>
        <p className="text-primary">
          We will send you an email with a link to cancel this request if you change your mind. This
          link will only work within the 30-day grace period.
        </p>
      </div>
      <form action={formAction} className="mx-1 flex flex-col gap-4">
        <InputPassword
          label="Password"
          name="password"
          required
          errorMessage={state?.fieldErrors?.password}
        />

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" type="button" onClick={closeModal}>
            Cancel
          </Button>
          <SubmitButton color="danger" pending={pending}>
            Delete account
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
