import { ConfirmationDialog } from '@repo/react-common/confirmation-dialog';

import { Modal } from '@/components/Modal';

interface DeleteItemModalProps {
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function DeleteItemModal({ isDeleting, onConfirm, onClose }: DeleteItemModalProps) {
  return (
    <Modal.Root open onOpenChange={onClose}>
      <Modal.Content
        title="Delete Item"
        role="alertdialog"
        ariaDescribedBy="confirmation-dialog-desc"
      >
        <ConfirmationDialog isPending={isDeleting} onConfirm={onConfirm} closeForm={onClose}>
          <p id="confirmation-dialog-desc">Are you sure you want to delete this item?</p>
        </ConfirmationDialog>
      </Modal.Content>
    </Modal.Root>
  );
}
