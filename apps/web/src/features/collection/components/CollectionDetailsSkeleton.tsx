import ItemsListSkeleton from '@/features/item/components/ItemsListSkeleton';
import ItemsTableSkeleton from '@/features/item/components/ItemsTableSkeleton';

export default function CollectionDetailsSkeleton() {
  return (
    <div
      className="flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-4 p-4"
      role="status"
      aria-busy="true"
      aria-label="Loading collection"
    >
      {/* Mobile summary — mirrors the SidebarPortal content shown inline on mobile */}
      <div className="flex flex-col gap-4 lg:hidden">
        <div className="flex min-h-0 flex-col gap-4">
          <div className="border-primary-ring flex min-h-0 flex-1 flex-col rounded-md border shadow-sm">
            <div className="flex-none p-4">
              <div className="flex items-center gap-3">
                <div className="flex-none p-2">
                  <div
                    className="bg-surface-overlay h-6 w-6 animate-pulse rounded"
                    aria-hidden="true"
                  />
                </div>
                <div
                  className="bg-surface-overlay h-7 w-40 animate-pulse rounded"
                  aria-hidden="true"
                />
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <div
                  className="bg-surface-overlay h-4 w-full animate-pulse rounded"
                  aria-hidden="true"
                />
                <div
                  className="bg-surface-overlay h-4 w-3/4 animate-pulse rounded"
                  aria-hidden="true"
                />
              </div>
              <div className="mt-4 flex justify-between">
                <div
                  className="bg-surface-overlay h-3 w-14 animate-pulse rounded"
                  aria-hidden="true"
                />
                <div
                  className="bg-surface-overlay h-3 w-16 animate-pulse rounded"
                  aria-hidden="true"
                />
              </div>
            </div>
            <div className="px-4 pb-2">
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
            <div className="flex flex-none justify-end gap-8 p-4">
              <div
                className="bg-surface-overlay h-6 w-6 animate-pulse rounded"
                aria-hidden="true"
              />
              <div
                className="bg-surface-overlay h-6 w-6 animate-pulse rounded"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
        <div className="flex w-full items-center gap-4">
          <div
            className="bg-surface-overlay h-9 flex-1 animate-pulse rounded-md"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-surface border-primary-ring w-full rounded-md border p-4 shadow-sm">
        <div className="flex gap-4">
          <div
            className="bg-surface-overlay h-9 min-w-0 flex-1 animate-pulse rounded-md"
            aria-hidden="true"
          />
          <div
            className="bg-surface-overlay h-9 w-9 flex-none animate-pulse rounded-md lg:hidden"
            aria-hidden="true"
          />
          <div
            className="bg-surface-overlay hidden h-9 min-w-0 flex-1 animate-pulse rounded-md lg:block"
            aria-hidden="true"
          />
          <div
            className="bg-surface-overlay hidden h-9 min-w-0 flex-1 animate-pulse rounded-md lg:block"
            aria-hidden="true"
          />
          <div
            className="bg-surface-overlay hidden h-9 w-9 flex-none animate-pulse rounded-md lg:block"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Mobile items */}
      <ItemsListSkeleton className="mb-32 flex w-full flex-col gap-2 lg:hidden" />

      {/* Desktop table */}
      <div className="hidden min-h-0 flex-1 lg:block">
        <ItemsTableSkeleton />
      </div>
    </div>
  );
}
