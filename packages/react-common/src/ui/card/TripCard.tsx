import { BsBackpack } from 'react-icons/bs';

export interface TripCardProps {
  id: string;
  name: string;
  date: Date;
  remarks: string;
  packName: string;
  numberOfItems: number;
  numberOfItemsPacked: number;
  onOpenTrip: (id: string) => void;
}

export default function TripCard(props: TripCardProps) {
  const { id, name, date, remarks, packName, numberOfItems, numberOfItemsPacked, onOpenTrip } =
    props;

  const percentagePacked = (numberOfItemsPacked / numberOfItems) * 100;
  const nameId = `trip-card-name-${id}`;
  const detailsId = `trip-card-details-${id}`;
  const remarksId = `trip-card-remarks-${id}`;
  const describedBy = remarks ? `${detailsId} ${remarksId}` : detailsId;

  return (
    <button
      type="button"
      onClick={() => onOpenTrip(id)}
      aria-labelledby={nameId}
      aria-describedby={describedBy}
      className="bg-surface text-primary border-primary-ring flex w-full cursor-pointer flex-col items-start justify-between gap-2 rounded-md border p-3 text-left shadow-sm transition-transform duration-150 ease-out hover:shadow-md focus-visible:ring-2 focus-visible:ring-(--color-primary) focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-0.5"
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div id={nameId} className="truncate text-sm font-bold">
            {name}
          </div>
          <div
            id={detailsId}
            className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2"
          >
            <div className="flex min-w-0 items-center gap-1 text-xs max-[319px]:w-full">
              <BsBackpack className="h-4 w-4" aria-hidden="true" />
              <span className="block truncate">{packName}</span>
            </div>
            <div className="bg-surface-overlay rounded-full px-1.5 py-0.5 text-xs">
              {date.toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-0">
          <div className="text-lg font-bold">{percentagePacked}%</div>
          <div className="text-primary/50 text-[10px] font-bold uppercase">ready</div>
        </div>
      </div>
      <div className="bg-info-ring h-2 w-full rounded-full">
        <div
          className="bg-primary h-full rounded-full"
          style={{ width: `${percentagePacked}%` }}
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
