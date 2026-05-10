export default function CollectionsViewSkeleton() {
  return (
    <div
      className="mb-32 flex w-full max-w-3xl flex-col gap-4 p-4 lg:mb-0 lg:h-full lg:max-w-full"
      role="status"
      aria-busy="true"
      aria-label="Loading collections"
    >
      <div className="bg-surface border-primary-ring w-full rounded-md border p-4 shadow-sm">
        <div className="flex gap-4">
          <div className="bg-surface-overlay h-9 min-w-0 flex-1 animate-pulse rounded-md" />
          <div className="bg-surface-overlay h-9 w-9 flex-none animate-pulse rounded-md md:hidden" />
          <div className="bg-surface-overlay hidden h-9 min-w-0 flex-1 animate-pulse rounded-md md:block" />
          <div className="bg-surface-overlay hidden h-9 min-w-0 flex-1 animate-pulse rounded-md md:block" />
          <div className="bg-surface-overlay hidden h-9 w-9 flex-none animate-pulse rounded-md md:block" />
        </div>
      </div>
      <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto" aria-hidden="true">
        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="bg-surface border-primary-ring flex min-h-50 w-full flex-col items-start justify-between gap-2 rounded-md border p-3 shadow-sm"
            >
              <div className="bg-surface-overlay h-5 w-5 animate-pulse rounded" />
              <div className="flex w-full flex-col items-start justify-between gap-1">
                <div className="bg-surface-overlay h-4 w-24 animate-pulse rounded" />
                <div className="bg-surface-overlay h-3 w-32 animate-pulse rounded" />
                <div className="flex w-full items-center justify-between">
                  <div className="bg-surface-overlay h-3 w-16 animate-pulse rounded" />
                  <div className="bg-surface-overlay h-3 w-20 animate-pulse rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
