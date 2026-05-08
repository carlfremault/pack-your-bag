'use client';

import toast from 'react-hot-toast';
import { MdOutlineCheckCircle } from 'react-icons/md';
import { TbExternalLink, TbTrash } from 'react-icons/tb';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button, SubmitButton } from '@repo/react-common/button';
import { FormNotReady } from '@repo/react-common/utils';

import { Modal } from '@/components/Modal';
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

  const confirmDeleteCollection = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
  // TODO: add trip impact
  // const impactedTrips = [];

  return (
    <Modal.Root open onOpenChange={onClose}>
      <Modal.Content
        title={<ModalTitle collectionType={collectionType} />}
        role="alertdialog"
        ariaDescribedBy="confirmation-dialog-desc"
      >
        <>
          <ImpactContent
            impactedPacks={impactedPacks}
            collectionType={collectionType}
            isLoading={isLoading}
            isError={isError}
          />
          <form
            onSubmit={confirmDeleteCollection}
            className="flex items-center gap-2 lg:justify-end"
          >
            <Button
              variant="outline"
              color="primary"
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="w-full lg:w-auto"
            >
              Cancel
            </Button>
            <SubmitButton
              color="danger"
              pending={isDeleting}
              disabled={isLoading}
              className="w-full lg:w-auto"
            >
              Delete
            </SubmitButton>
          </form>
        </>
      </Modal.Content>
    </Modal.Root>
  );
}

function ModalTitle({ collectionType }: { collectionType: CollectionType }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="bg-danger/10 flex h-8 w-8 items-center justify-center rounded-md">
        <TbTrash size={16} className="text-danger" />
      </div>
      <span>Delete {collectionType}</span>
    </div>
  );
}

interface ImpactContentProps {
  impactedPacks: { id: string; name: string }[];
  collectionType: CollectionType;
  isLoading: boolean;
  isError: boolean;
}
function ImpactContent(props: ImpactContentProps) {
  const { impactedPacks, collectionType, isLoading, isError } = props;

  let dialogContent: React.ReactNode;

  if (isLoading) {
    dialogContent = <FormNotReady />;
  } else if (isError) {
    dialogContent = <p>{ERROR_LOADING_IMPACT[collectionType]}</p>;
  } else if (impactedPacks.length === 0) {
    dialogContent = <Reassurance>{NO_IMPACT[collectionType]}</Reassurance>;
  } else if (collectionType === 'list') {
    dialogContent = <ListImpact packs={impactedPacks} />;
  } else {
    dialogContent = <p>Todo: impact content for packs</p>;
  }

  return (
    <div
      id="confirmation-dialog-desc"
      className="text-primary mb-6 flex min-h-0 flex-1 flex-col gap-4 py-4 text-sm"
    >
      {dialogContent}
      {!isLoading && <Reassurance>{IMPACT_REASSURANCE[collectionType]}</Reassurance>}
    </div>
  );
}

function ListImpact({ packs }: { packs: { id: string; name: string }[] }) {
  const packsCount = packs.length;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="mb-2">
        This list is used in{' '}
        <strong className="font-medium">
          {packsCount} pack{packsCount === 1 ? '' : 's'}
        </strong>
        . Deleting it will remove its content from all of them.
      </p>
      <p className="mb-2 text-xs font-medium tracking-wider uppercase">Affected packs</p>
      <AffectedPacksList packs={packs} />
    </div>
  );
}

function AffectedPacksList({ packs }: { packs: { id: string; name: string }[] }) {
  return (
    <div className="border-primary-ring min-h-0 flex-1 overflow-y-auto rounded-md border">
      {packs.map((pack, index) => (
        <div
          key={pack.id}
          className={`px-3 py-2 ${index > 0 ? 'border-primary-ring border-t' : ''}`}
        >
          <Link
            href={`/pack/${pack.id}`}
            target="_blank"
            rel="noopener"
            className="hover:text-info flex items-center justify-between"
          >
            <span className="text-sm">{pack.name}</span>
            <div className="flex">
              <TbExternalLink size={14} />
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}

function Reassurance({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <MdOutlineCheckCircle size={15} className="text-success mt-0.5 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
