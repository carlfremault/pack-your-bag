export default function ItemsListSkeleton({ className }: { className?: string }) {
  return (
    <div role="status" aria-busy="true" aria-label="Loading items list" className={className}>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="bg-surface border-primary-ring flex h-26 w-full flex-col justify-between rounded-md border p-3 shadow-sm"
        >
          <div className="flex w-full items-center justify-between">
            <div className="bg-surface-overlay h-4 w-36 animate-pulse rounded" />
            <div className="bg-surface-overlay h-5 w-5 animate-pulse rounded" />
          </div>
          <div className="bg-surface-overlay h-5 w-20 animate-pulse rounded-full" />
          <div className="bg-surface-overlay h-3 w-full animate-pulse rounded" />
          <div className="flex w-full items-center justify-between">
            <div className="bg-surface-overlay h-3 w-20 animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
