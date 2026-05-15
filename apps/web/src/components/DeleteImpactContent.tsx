import { TbExternalLink } from 'react-icons/tb';
import Link from 'next/link';

import { CheckedWrapper, DangerWrapper, FormNotReady } from '@repo/react-common/utils';

type DeleteEntry = 'item' | 'list' | 'pack';
type ImpactEntry = { id: string; name: string };

interface ImpactContentProps {
  deleteEntry: DeleteEntry;
  impactedLists?: ImpactEntry[];
  impactedPacks?: ImpactEntry[];
  impactedTrips?: ImpactEntry[];
  errorLoadingMessage: string;
  noImpactMessage: string;
  reassuranceMessage?: string;
  isLoading: boolean;
  isError: boolean;
}

export default function DeleteImpactContent(props: ImpactContentProps) {
  const {
    deleteEntry,
    impactedLists,
    impactedPacks,
    impactedTrips,
    errorLoadingMessage,
    noImpactMessage,
    reassuranceMessage,
    isLoading,
    isError,
  } = props;

  const impactedListsLength = impactedLists?.length ?? 0;
  const impactedPacksLength = impactedPacks?.length ?? 0;
  const impactedTripsLength = impactedTrips?.length ?? 0;

  let dialogContent: React.ReactNode;
  if (isLoading) {
    dialogContent = <FormNotReady />;
  } else if (isError) {
    dialogContent = <DangerWrapper>{errorLoadingMessage}</DangerWrapper>;
  } else if (impactedListsLength === 0 && impactedPacksLength === 0 && impactedTripsLength === 0) {
    dialogContent = <CheckedWrapper>{noImpactMessage}</CheckedWrapper>;
  } else {
    const dialogMessage = getDialogMessage(
      deleteEntry,
      impactedListsLength,
      impactedPacksLength,
      impactedTripsLength,
    );

    dialogContent = (
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {dialogMessage}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
          {impactedLists && impactedListsLength ? (
            <ImpactList entries={impactedLists} label="list" />
          ) : null}
          {impactedPacks && impactedPacksLength ? (
            <ImpactList entries={impactedPacks} label="pack" />
          ) : null}
          {impactedTrips && impactedTripsLength ? (
            <ImpactList entries={impactedTrips} label="trip" />
          ) : null}
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
      {!isLoading && !isError && reassuranceMessage && (
        <CheckedWrapper>{reassuranceMessage}</CheckedWrapper>
      )}
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

const formatter = new Intl.ListFormat(undefined, { style: 'long', type: 'conjunction' });

function getDialogMessage(
  deleteEntry: DeleteEntry,
  impactedListsLength: number,
  impactedPacksLength: number,
  impactedTripsLength: number,
) {
  const dialogMessage = `This ${deleteEntry} is assigned to `;
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

  return (
    <p>
      {dialogMessage}
      <strong>{formatter.format(segments)}</strong>.
    </p>
  );
}
