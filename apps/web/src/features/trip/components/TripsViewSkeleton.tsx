export default function TripsViewSkeleton() {
  return (
    <div
      className="mb-32 flex w-full max-w-7xl flex-col gap-4 p-4"
      role="status"
      aria-busy="true"
      aria-label="Loading trips"
    >
      <div className="bg-surface border-primary-ring w-full rounded-md border p-4 shadow-sm">
        <div className="flex gap-4">
          <div className="bg-surface-overlay h-9 min-w-0 flex-1 animate-pulse rounded-md" />
          <div className="bg-surface-overlay h-9 w-9 flex-none animate-pulse rounded-md lg:hidden" />
          <div className="bg-surface-overlay hidden h-9 min-w-0 flex-1 animate-pulse rounded-md lg:block" />
          <div className="bg-surface-overlay hidden h-9 min-w-0 flex-1 animate-pulse rounded-md lg:block" />
          <div className="bg-surface-overlay hidden h-9 w-28 flex-none animate-pulse rounded-md lg:block" />
          <div className="bg-surface-overlay hidden h-9 w-9 flex-none animate-pulse rounded-md lg:block" />
        </div>
      </div>
      <div className="flex w-full flex-col gap-2" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="bg-surface border-primary-ring flex w-full flex-col gap-6 rounded-md border p-3 shadow-sm"
          >
            <div className="flex w-full items-center justify-between">
              <div className="flex min-w-0 flex-1 flex-col gap-4">
                <div className="flex gap-4">
                  <div className="bg-surface-overlay h-4 w-32 animate-pulse rounded" />
                  <div className="bg-surface-overlay h-4 w-16 animate-pulse rounded-full" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="bg-surface-overlay h-4 w-4 animate-pulse rounded" />
                  <div className="bg-surface-overlay h-3 w-24 animate-pulse rounded" />
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="bg-surface-overlay h-7 w-10 animate-pulse rounded" />
                <div className="bg-surface-overlay h-2 w-8 animate-pulse rounded" />
              </div>
            </div>
            <div className="bg-surface-overlay h-2 w-full animate-pulse rounded-full" />
            <div className="bg-surface-overlay h-2 w-16 animate-pulse rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
