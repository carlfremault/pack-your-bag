'use client';

import toast from 'react-hot-toast';

import { ConfirmationDialog } from '@repo/react-common/confirmation-dialog';

import { Modal } from '@/components/Modal';
import { DeleteModalTitle } from '@/components/Modal/ModalTitle';

import { useDeleteItem } from '../queries';

interface ItemDeleteModalProps {
  itemId: string;
  onClose: () => void;
}

export default function ItemDeleteModal(props: ItemDeleteModalProps) {
  const { itemId, onClose } = props;
  const { mutate: deleteItem, isPending: isDeleting } = useDeleteItem();

  const confirmDeleteItem = () => {
    deleteItem(itemId, {
      onSuccess: () => {
        toast.success('Item deleted successfully');
        onClose();
      },
    });
  };

  return (
    <Modal.Root open onOpenChange={onClose}>
      <Modal.Content
        title={<DeleteModalTitle label="Delete Item" />}
        role="alertdialog"
        ariaDescribedBy="confirmation-dialog-desc"
      >
        <p id="confirmation-dialog-desc" className="text-primary mb-6 py-4 text-sm">
          Are you sure you want to delete this item?
        </p>
        <ConfirmationDialog
          isPending={isDeleting}
          onConfirm={confirmDeleteItem}
          onClose={onClose}
          submitButtonColor="danger"
          submitButtonText="Delete"
        />
      </Modal.Content>
    </Modal.Root>
  );
}
