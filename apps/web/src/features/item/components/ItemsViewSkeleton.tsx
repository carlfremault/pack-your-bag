import ItemsListSkeleton from './ItemsListSkeleton';
import ItemsTableSkeleton from './ItemsTableSkeleton';

export default function ItemsViewSkeleton() {
  return (
    <div
      className="mb-32 flex w-full max-w-3xl flex-col gap-4 p-4 lg:mb-0 lg:h-full lg:max-w-full lg:overflow-hidden"
      role="status"
      aria-busy="true"
      aria-label="Loading items"
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
      <ItemsListSkeleton className="flex w-full flex-col gap-2 lg:hidden" />
      <div className="hidden min-h-0 flex-1 lg:block">
        <ItemsTableSkeleton />
      </div>
    </div>
  );
}
