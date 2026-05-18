'use client';

import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

import { ConfirmationDialog } from '@repo/react-common/confirmation-dialog';

import DeleteImpactContent from '@/components/DeleteImpactContent';
import { Modal } from '@/components/Modal';
import { DeleteModalTitle } from '@/components/Modal/ModalTitle';
import { capitalizeFirstLetter } from '@/utils/capitalizeFirstLetter';

import { useCollectionDeleteImpact, useDeleteCollection } from '../queries';
import { CollectionType } from '../types';

const ERROR_LOADING_IMPACT: Record<CollectionType, string> = {
  list: 'There was an error loading impact data. This list may be used in some packs. Deleting it will also remove its content from those packs.',
  pack: 'There was an error loading impact data. This pack may be assigned to some trips. Deleting it will leave those trips without an assigned pack.',
};

const NO_IMPACT: Record<CollectionType, string> = {
  list: "This list isn't used in any pack, deleting it is safe.",
  pack: "This pack isn't assigned to any trip, deleting it is safe.",
};

const IMPACT_REASSURANCE: Record<CollectionType, string> = {
  list: "Your items won't be affected — they'll stay in your library.",
  pack: "Your items and lists won't be affected — they'll stay in your library.",
};

export interface CollectionDeleteModalProps {
  collectionId: string;
  collectionType: CollectionType;
  onClose: () => void;
}

export default function CollectionDeleteModal(props: CollectionDeleteModalProps) {
  const { collectionId, collectionType, onClose } = props;

  const router = useRouter();

  const { data, isLoading, isError } = useCollectionDeleteImpact({
    type: collectionType,
    id: collectionId,
  });
  const { mutate: deleteCollection, isPending: isDeleting } = useDeleteCollection();

  const confirmDeleteCollection = () => {
    deleteCollection(
      { type: collectionType, id: collectionId },
      {
        onSuccess: () => {
          onClose();
          router.replace('/collections');
          toast.success(`${capitalizeFirstLetter(collectionType)} deleted successfully`);
        },
      },
    );
  };

  const impactedPacks = data && 'packs' in data ? data.packs : [];
  const impactedTrips = data && 'trips' in data ? data.trips : [];

  return (
    <Modal.Root open onOpenChange={onClose}>
      <Modal.Content
        title={<DeleteModalTitle label={`Delete ${collectionType}`} />}
        role="alertdialog"
        ariaDescribedBy="confirmation-dialog-desc"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <DeleteImpactContent
              deleteEntry={collectionType}
              impactedPacks={impactedPacks}
              impactedTrips={impactedTrips}
              errorLoadingMessage={ERROR_LOADING_IMPACT[collectionType]}
              noImpactMessage={NO_IMPACT[collectionType]}
              reassuranceMessage={IMPACT_REASSURANCE[collectionType]}
              isLoading={isLoading}
              isError={isError}
            />
          </div>
          <ConfirmationDialog
            isPending={isDeleting}
            isLoading={isLoading}
            onConfirm={confirmDeleteCollection}
            onClose={onClose}
            submitButtonColor="danger"
            submitButtonText="Delete"
          />
        </div>
      </Modal.Content>
    </Modal.Root>
  );
}
