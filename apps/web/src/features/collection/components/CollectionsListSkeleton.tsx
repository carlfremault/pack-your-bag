export default function CollectionsListSkeleton({ className }: { className?: string }) {
  return (
    <div className={className} role="status" aria-busy="true" aria-label="Loading collections">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          aria-hidden="true"
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
  );
}
