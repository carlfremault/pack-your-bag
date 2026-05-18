'use client';

import classNames from 'classnames';

import { Modal } from '@/components/Modal';
import DeleteAccountForm from '@/features/auth/components/DeleteAccountForm';

export interface DeleteAccountCardProps {
  locale?: string;
  disabled?: boolean;
}

export default function DeleteAccountCard(props: DeleteAccountCardProps) {
  const { locale, disabled = false } = props;

  return (
    <div
      className={classNames(
        'bg-surface border-danger text-primary flex w-full flex-col gap-2 rounded-md border p-4 shadow-sm transition-opacity',
        disabled && 'opacity-50',
      )}
      aria-disabled={disabled}
    >
      <p>
        Delete your PackYourBag! account. This will delete all your data, including your items,
        categories, collections, trips and settings.
      </p>
      {disabled && (
        <p className="text-primary/70 text-sm italic">
          Sign up for a full account to manage your account.
        </p>
      )}
      <div className="flex justify-end">
        <Modal.Root>
          <Modal.Trigger color="danger" variant="outline" disabled={disabled}>
            Delete account
          </Modal.Trigger>
          <Modal.Content
            title="Delete account"
            titleColor="danger"
            role="alertdialog"
            ariaDescribedBy="modal-description"
          >
            {(closeModal) => <DeleteAccountForm closeModal={closeModal} locale={locale} />}
          </Modal.Content>
        </Modal.Root>
      </div>
    </div>
  );
}
