import { ConfirmationDialog } from '@repo/react-common/confirmation-dialog';
import { Spinner } from '@repo/react-common/spinner';

import { Modal } from '@/components/Modal';

import { useCategoryDeleteImpact } from '../queries';

interface DeleteCategoryModalProps {
  categoryId: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function DeleteCategoryModal({
  categoryId,
  isDeleting,
  onConfirm,
  onClose,
}: DeleteCategoryModalProps) {
  const { data, isLoading, isError } = useCategoryDeleteImpact(categoryId);

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
          onConfirm={onConfirm}
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
