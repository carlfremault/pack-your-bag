'use client';

import toast from 'react-hot-toast';

import { ConfirmationDialog } from '@repo/react-common/confirmation-dialog';
import { Spinner } from '@repo/react-common/spinner';

import { Modal } from '@/components/Modal';
import { extractErrorMessage } from '@/utils/extractApiErrorDetails';

import { useCategoryDeleteImpact, useDeleteCategory } from '../queries';

interface CategoryDeleteModalProps {
  categoryId: string;
  onClose: () => void;
}

export default function CategoryDeleteModal(props: CategoryDeleteModalProps) {
  const { categoryId, onClose } = props;
  const { data, isLoading, isError } = useCategoryDeleteImpact(categoryId);
  const { mutate: deleteCategory, isPending: isDeleting } = useDeleteCategory();

  const confirmDeleteCategory = () => {
    deleteCategory(categoryId, {
      onSuccess: () => {
        onClose();
        toast.success('Category deleted successfully');
      },
      onError: (error) => {
        toast.error(`Error: ${extractErrorMessage(error)}`);
      },
    });
  };

  const impactedItems = data?.items ?? [];
  const impactedItemsCount = impactedItems.length;
  const impactMessage = `This category is assigned to ${impactedItemsCount} item${impactedItemsCount === 1 ? '' : 's'}.`;

  return (
    <Modal.Root open onOpenChange={onClose}>
      <Modal.Content
        title="Delete Category"
        role="alertdialog"
        ariaDescribedBy="confirmation-dialog-desc"
      >
        <ConfirmationDialog
          isPending={isDeleting}
          disabled={isLoading || isError}
          onConfirm={confirmDeleteCategory}
          closeForm={onClose}
        >
          <div id="confirmation-dialog-desc">
            {isLoading ? (
              <div className="flex items-center justify-center">
                <Spinner size="small" />
              </div>
            ) : (
              <>
                <p>{impactMessage}</p>
                <p>Are you sure you want to delete this category?</p>
              </>
            )}
          </div>
        </ConfirmationDialog>
      </Modal.Content>
    </Modal.Root>
  );
}
