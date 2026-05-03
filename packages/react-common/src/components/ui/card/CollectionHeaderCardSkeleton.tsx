const SKELETON_CATEGORY_COUNT = 3;

export function CollectionHeaderCardSkeleton() {
  return (
    <div
      className="flex w-full flex-col gap-6 sm:flex-row sm:gap-8"
      role="status"
      aria-busy="true"
      aria-label="Loading collection details"
    >
      <div className="flex flex-none flex-row justify-between gap-4 sm:flex-col">
        <div className="self-center p-4">
          <div className="bg-surface-overlay h-9 w-9 animate-pulse rounded" />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between gap-4">
            <div className="bg-surface-overlay h-4 w-14 animate-pulse rounded" />
            <div className="bg-surface-overlay h-4 w-16 animate-pulse rounded" />
          </div>
          <div className="flex flex-col gap-2">
            {Array.from({ length: SKELETON_CATEGORY_COUNT }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="bg-surface-overlay h-6 w-20 animate-pulse rounded-full" />
                <div className="bg-surface-overlay h-4 w-10 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between gap-4">
        <div className="flex flex-col gap-4">
          <div className="bg-surface-overlay h-7 w-48 animate-pulse rounded sm:mt-4" />
          <div className="flex flex-col gap-2">
            <div className="bg-surface-overlay h-4 w-full animate-pulse rounded" />
            <div className="bg-surface-overlay h-4 w-3/4 animate-pulse rounded" />
          </div>
        </div>
        <div className="flex justify-end gap-8">
          <div className="bg-surface-overlay h-6 w-6 animate-pulse rounded" />
          <div className="bg-surface-overlay h-6 w-6 animate-pulse rounded" />
        </div>
      </div>
    </div>
  );
}
