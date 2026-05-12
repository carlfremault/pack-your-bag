import { BsBackpack } from 'react-icons/bs';

export interface TripCardProps {
  id: string;
  name: string;
  date?: string;
  remarks?: string;
  packName?: string;
  numberOfItems: number;
  numberOfItemsPacked: number;
  href: string;
  linkAs?: React.ElementType;
}

export function TripCard(props: TripCardProps) {
  const {
    id,
    name,
    date,
    remarks,
    packName,
    numberOfItems,
    numberOfItemsPacked,
    href,
    linkAs: LinkComponent = 'a',
  } = props;

  const percentagePacked =
    numberOfItems > 0 ? Math.round((numberOfItemsPacked / numberOfItems) * 100) : 0;
  const clampedPercentage = Math.min(100, Math.max(0, percentagePacked));

  const nameId = `trip-card-name-${id}`;
  const remarksId = `trip-card-remarks-${id}`;
  const dateId = `trip-card-date-${id}`;
  const packId = `trip-card-pack-${id}`;
  const statsId = `trip-card-stats-${id}`;

  const describedByParts = [
    remarks ? remarksId : null,
    date ? dateId : null,
    packName ? packId : null,
    statsId,
  ].filter(Boolean) as string[];
  const describedBy = describedByParts.join(' ');

  const tripCardClassName =
    'bg-surface text-primary border-primary-ring flex w-full cursor-pointer flex-col items-start justify-between gap-6 rounded-md border p-3 text-left shadow-sm transition-transform duration-150 ease-out hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2  focus-visible:ring-primary-ring focus-visible:outline-none active:translate-y-0.5';

  return (
    <LinkComponent
      href={href}
      aria-labelledby={nameId}
      aria-describedby={describedBy}
      className={tripCardClassName}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex gap-2">
            <span id={nameId} className="truncate text-sm font-bold">
              {name}
            </span>
            {date && (
              <div
                id={dateId}
                className="bg-surface border-primary-ring text-primary rounded-full border px-1.5 py-0.5 text-[10px] font-medium"
              >
                {date}
              </div>
            )}
          </div>
          <div id={packId} className="flex min-w-0 items-center gap-1 text-xs">
            <BsBackpack className="h-4 w-4" aria-hidden="true" />
            <span className="me-4 block truncate">{packName ?? '--'}</span>
          </div>
        </div>
        <div id={statsId} className="flex flex-col items-center gap-0">
          <div className="text-accent-emphasis text-lg font-bold">{percentagePacked}%</div>
          <div className="text-accent-emphasis text-[10px] font-bold uppercase">ready</div>
        </div>
      </div>
      <div className="bg-accent-ring h-2 w-full rounded-full">
        <div
          className="bg-accent h-full rounded-full"
          style={{ width: `${clampedPercentage}%` }}
        ></div>
      </div>
      {remarks && (
        <div id={remarksId} className="text-xs font-light">
          {remarks}
        </div>
      )}
    </LinkComponent>
  );
}
