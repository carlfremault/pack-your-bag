'use client';

import toast from 'react-hot-toast';
import { TbExternalLink } from 'react-icons/tb';
import Link from 'next/link';

import { ConfirmationDialog } from '@repo/react-common/confirmation-dialog';
import { CheckedWrapper, DangerWrapper, FormNotReady } from '@repo/react-common/utils';

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
            <ImpactContent
              impactedLists={impactedLists}
              impactedPacks={impactedPacks}
              impactedTrips={impactedTrips}
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

type ImpactEntry = { id: string; name: string };
interface ImpactContentProps {
  impactedLists: ImpactEntry[];
  impactedPacks: ImpactEntry[];
  impactedTrips: ImpactEntry[];
  isLoading: boolean;
  isError: boolean;
}

function ImpactContent(props: ImpactContentProps) {
  const { impactedLists, impactedPacks, impactedTrips, isLoading, isError } = props;
  const impactedListsLength = impactedLists.length;
  const impactedPacksLength = impactedPacks.length;
  const impactedTripsLength = impactedTrips.length;

  const dialogMessage = getDialogMessage(
    impactedListsLength,
    impactedPacksLength,
    impactedTripsLength,
  );

  let dialogContent: React.ReactNode;
  if (isLoading) {
    dialogContent = <FormNotReady />;
  } else if (isError) {
    dialogContent = <DangerWrapper>{ERROR_LOADING_IMPACT}</DangerWrapper>;
  } else if (impactedListsLength === 0 && impactedPacksLength === 0 && impactedTripsLength === 0) {
    dialogContent = <CheckedWrapper>{NO_IMPACT}</CheckedWrapper>;
  } else {
    dialogContent = (
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {dialogMessage}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
          {impactedListsLength ? <ImpactList entries={impactedLists} label="list" /> : null}
          {impactedPacksLength ? <ImpactList entries={impactedPacks} label="pack" /> : null}
          {impactedTripsLength ? <ImpactList entries={impactedTrips} label="trip" /> : null}
        </div>
      </div>
    );
  }

  return (
    <div
      id="confirmation-dialog-desc"
      className="text-primary flex min-h-0 flex-1 flex-col gap-4 py-4 text-sm"
    >
      {dialogContent}
    </div>
  );
}

interface ImpactListProps {
  entries: ImpactEntry[];
  label: 'list' | 'pack' | 'trip';
}

function ImpactList({ entries, label }: ImpactListProps) {
  return (
    <div className="flex flex-col">
      <p className="mb-2 text-xs font-medium tracking-wider uppercase">
        {`Affected ${label}${entries.length === 1 ? '' : 's'}`}
      </p>
      <div className="border-primary-ring min-h-0 flex-1 overflow-y-auto rounded-md border">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className={`px-3 py-2 ${index > 0 ? 'border-primary-ring border-t' : ''}`}
          >
            <Link
              href={`/${label}/${entry.id}`}
              target="_blank"
              rel="noopener"
              aria-label={`${entry.name} (opens in new tab)`}
              className="hover:text-info flex items-center justify-between"
            >
              <span className="truncate text-sm">{entry.name}</span>
              <div className="flex">
                <TbExternalLink size={14} />
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function getDialogMessage(
  impactedListsLength: number,
  impactedPacksLength: number,
  impactedTripsLength: number,
) {
  const dialogMessage = 'This item is assigned to ';
  const listImpactMessage = impactedListsLength
    ? `${impactedListsLength} list${impactedListsLength === 1 ? '' : 's'}`
    : undefined;
  const packImpactMessage = impactedPacksLength
    ? `${impactedPacksLength} pack${impactedPacksLength === 1 ? '' : 's'}`
    : undefined;
  const tripImpactMessage = impactedTripsLength
    ? `${impactedTripsLength} trip${impactedTripsLength === 1 ? '' : 's'}`
    : undefined;
  const segments = [listImpactMessage, packImpactMessage, tripImpactMessage].filter(
    (s): s is string => s !== undefined,
  );
  const formatter = new Intl.ListFormat(undefined, { style: 'long', type: 'conjunction' });
  return (
    <p>
      {dialogMessage}
      <strong>{formatter.format(segments)}</strong>.
    </p>
  );
}
