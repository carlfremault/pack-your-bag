import ListCardsListSkeleton from './ListCardsListSkeleton';

export default function AddListsModalSkeleton() {
  return (
    <div
      className="flex h-full flex-col gap-4"
      role="status"
      aria-busy="true"
      aria-label="Loading lists"
    >
      <div className="bg-surface border-primary-ring w-full rounded-md border p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:gap-4">
          <div className="flex gap-4 md:contents">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div
                className="bg-surface-overlay h-4 w-12 animate-pulse rounded"
                aria-hidden="true"
              />
              <div
                className="bg-surface-overlay h-9 w-full animate-pulse rounded-md"
                aria-hidden="true"
              />
            </div>
            <div className="flex flex-col justify-end md:hidden">
              <div
                className="bg-surface-overlay h-9 w-9 animate-pulse rounded-md"
                aria-hidden="true"
              />
            </div>
          </div>
          <div className="hidden md:contents">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div
                className="bg-surface-overlay h-4 w-10 animate-pulse rounded"
                aria-hidden="true"
              />
              <div
                className="bg-surface-overlay h-9 w-full animate-pulse rounded-md"
                aria-hidden="true"
              />
            </div>
            <div className="flex flex-col gap-1.5 self-start">
              <div
                className="bg-surface-overlay h-4 w-16 animate-pulse rounded"
                aria-hidden="true"
              />
              <div
                className="bg-surface-overlay h-9 w-9 animate-pulse rounded-md"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 md:overflow-y-auto">
        <ListCardsListSkeleton className="flex w-full flex-col gap-2" />
      </div>
    </div>
  );
}
