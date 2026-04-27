'use client';

import { Modal } from '@/components/Modal';
import DeleteAccountForm from '@/features/auth/components/DeleteAccountForm';

interface DeleteAccountCardProps {
  locale?: string;
}

export default function DeleteAccountCard(props: DeleteAccountCardProps) {
  const { locale } = props;

  return (
    <div className="bg-surface border-danger text-primary flex w-full flex-col gap-2 rounded-md border p-4 shadow-sm">
      <p>
        Delete your PackYourBag! account. This will delete all your data, including your items,
        categories, collections, trips and settings.
      </p>
      <div className="flex justify-end">
        <Modal.Root>
          <Modal.Trigger color="danger" variant="outline">
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
