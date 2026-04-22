'use client';

import toast from 'react-hot-toast';

import { ConfirmationDialog } from '@repo/react-common/confirmation-dialog';

import { Modal } from '@/components/Modal';
import { extractErrorMessage } from '@/utils/extractApiErrorDetails';

import { useDeleteItem } from '../queries';

interface DeleteItemModalProps {
  itemId: string;
  onClose: () => void;
}

export default function DeleteItemModal(props: DeleteItemModalProps) {
  const { itemId, onClose } = props;
  const { mutate: deleteItem, isPending: isDeleting } = useDeleteItem();

  const confirmDeleteItem = () => {
    deleteItem(itemId, {
      onSuccess: () => {
        toast.success('Item deleted successfully');
        onClose();
      },
      onError: (error) => {
        toast.error(`Error: ${extractErrorMessage(error)}`);
      },
    });
  };

  return (
    <Modal.Root open onOpenChange={onClose}>
      <Modal.Content
        title="Delete Item"
        role="alertdialog"
        ariaDescribedBy="confirmation-dialog-desc"
      >
        <ConfirmationDialog
          isPending={isDeleting}
          onConfirm={confirmDeleteItem}
          closeForm={onClose}
        >
          <p id="confirmation-dialog-desc">Are you sure you want to delete this item?</p>
        </ConfirmationDialog>
      </Modal.Content>
    </Modal.Root>
  );
}
