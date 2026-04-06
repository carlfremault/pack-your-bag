import { BsBackpack } from 'react-icons/bs';

export interface TripCardProps {
  id: string;
  name: string;
  date?: Date;
  remarks?: string;
  packName?: string;
  numberOfItems: number;
  numberOfItemsPacked: number;
  onOpenTrip: (id: string) => void;
}

export default function TripCard(props: TripCardProps) {
  const { id, name, date, remarks, packName, numberOfItems, numberOfItemsPacked, onOpenTrip } =
    props;

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

  return (
    <button
      type="button"
      onClick={() => onOpenTrip(id)}
      aria-labelledby={nameId}
      aria-describedby={describedBy}
      className="bg-surface text-primary border-primary-ring flex w-full cursor-pointer flex-col items-start justify-between gap-3 rounded-md border p-3 text-left shadow-sm transition-transform duration-150 ease-out hover:shadow-md focus-visible:ring-2 focus-visible:ring-(--color-primary) focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-0.5"
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex gap-2">
            <span id={nameId} className="truncate text-sm font-bold">
              {name}
            </span>
            {date && (
              <div
                id={dateId}
                className="bg-surface-overlay border-primary-ring rounded-full border px-1.5 py-0.5 text-[10px] font-medium"
              >
                {date.toLocaleDateString()}
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
    </button>
  );
}
