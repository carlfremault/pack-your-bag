'use client';

import toast from 'react-hot-toast';
import { TbTrash } from 'react-icons/tb';

import { ConfirmationDialog } from '@repo/react-common/confirmation-dialog';

import { Modal } from '@/components/Modal';

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
        title={<ModalTitle />}
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

function ModalTitle() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="bg-danger/10 flex h-8 w-8 items-center justify-center rounded-md">
        <TbTrash size={16} className="text-danger" />
      </div>
      <span>Delete Item</span>
    </div>
  );
}
