export default function CollectionDetailsSkeleton() {
  return (
    <div
      className="bg-surface border-primary-ring m-4 flex w-full flex-col gap-4 rounded-md border p-4 shadow-sm"
      role="status"
      aria-busy="true"
      aria-label="Loading collection"
    >
      <div className="border-primary-ring flex w-full flex-col gap-6 rounded-md border p-4 shadow-sm sm:flex-row sm:gap-8">
        <div className="flex flex-none flex-row justify-between gap-4 sm:flex-col">
          <div className="self-center p-4">
            <div className="bg-surface-overlay h-9 w-9 animate-pulse rounded" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between gap-4">
              <div
                className="bg-surface-overlay h-4 w-14 animate-pulse rounded"
                aria-hidden="true"
              />
              <div
                className="bg-surface-overlay h-4 w-16 animate-pulse rounded"
                aria-hidden="true"
              />
            </div>
            <div className="flex flex-col gap-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div
                    className="bg-surface-overlay h-6 w-20 animate-pulse rounded-full"
                    aria-hidden="true"
                  />
                  <div
                    className="bg-surface-overlay h-4 w-10 animate-pulse rounded"
                    aria-hidden="true"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-between gap-4">
          <div className="flex flex-col gap-4">
            <div
              className="bg-surface-overlay h-7 w-48 animate-pulse rounded sm:mt-4"
              aria-hidden="true"
            />
            <div className="flex flex-col gap-2">
              <div
                className="bg-surface-overlay h-4 w-full animate-pulse rounded"
                aria-hidden="true"
              />
              <div
                className="bg-surface-overlay h-4 w-3/4 animate-pulse rounded"
                aria-hidden="true"
              />
            </div>
          </div>
          <div className="flex justify-end gap-8">
            <div className="bg-surface-overlay h-6 w-6 animate-pulse rounded" aria-hidden="true" />
            <div className="bg-surface-overlay h-6 w-6 animate-pulse rounded" aria-hidden="true" />
          </div>
        </div>
      </div>
      <div className="bg-surface-overlay h-48 w-full animate-pulse rounded-md" aria-hidden="true" />
    </div>
  );
}
