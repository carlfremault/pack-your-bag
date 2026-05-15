'use client';

import toast from 'react-hot-toast';

import { ConfirmationDialog } from '@repo/react-common/confirmation-dialog';

import DeleteImpactContent from '@/components/DeleteImpactContent';
import { Modal } from '@/components/Modal';
import { DeleteModalTitle } from '@/components/Modal/ModalTitle';

import { useDeleteItem, useItemDeleteImpact } from '../queries';

const ERROR_LOADING_IMPACT =
  'There was an error loading impact data. You may proceed if you are sure.';
const NO_IMPACT = 'This item is not assigned to any list, pack or trip.';

interface ItemDeleteModalProps {
  itemId: string;
  onClose: () => void;
}

export default function ItemDeleteModal(props: ItemDeleteModalProps) {
  const { itemId, onClose } = props;

  const { data, isLoading, isError } = useItemDeleteImpact(itemId);
  const { mutate: deleteItem, isPending: isDeleting } = useDeleteItem();

  const confirmDeleteItem = () => {
    deleteItem(itemId, {
      onSuccess: () => {
        toast.success('Item deleted successfully');
        onClose();
      },
    });
  };

  const impactedLists = data?.lists ?? [];
  const impactedPacks = data?.packs ?? [];
  const impactedTrips = data?.trips ?? [];

  return (
    <Modal.Root open onOpenChange={onClose}>
      <Modal.Content
        title={<DeleteModalTitle label="Delete Item" />}
        role="alertdialog"
        ariaDescribedBy="confirmation-dialog-desc"
        className="max-w-md"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <DeleteImpactContent
              deleteEntry="item"
              impactedLists={impactedLists}
              impactedPacks={impactedPacks}
              impactedTrips={impactedTrips}
              errorLoadingMessage={ERROR_LOADING_IMPACT}
              noImpactMessage={NO_IMPACT}
              isLoading={isLoading}
              isError={isError}
            />
          </div>
          <ConfirmationDialog
            isPending={isDeleting}
            isLoading={isLoading}
            onConfirm={confirmDeleteItem}
            onClose={onClose}
            submitButtonColor="danger"
            submitButtonText="Delete"
          />
        </div>
      </Modal.Content>
    </Modal.Root>
  );
}
