const SKELETON_ROW_COUNT = 6;

export default function ItemsTableSkeleton() {
  return (
    <div
      className="bg-surface border-primary-ring flex h-full w-full overflow-hidden rounded-md border shadow-sm"
      role="region"
      aria-busy="true"
      aria-label="Loading items table"
    >
      <div className="flex-1 overflow-y-auto">
        <table className="text-primary w-full border-collapse">
          <thead className="border-primary-ring border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                Weight
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
              <tr
                key={`skeleton-row-${index}`}
                className={index % 2 === 0 ? 'bg-surface' : 'bg-surface-overlay/70'}
              >
                <td className="px-4 py-3">
                  <div className="bg-surface-overlay h-4 w-32 animate-pulse rounded" />
                </td>
                <td className="px-4 py-3">
                  <div className="bg-surface-overlay h-4 w-full max-w-sm animate-pulse rounded" />
                </td>
                <td className="px-4 py-3">
                  <div className="bg-surface-overlay h-4 w-16 animate-pulse rounded" />
                </td>
                <td className="px-4 py-3">
                  <div className="bg-surface-overlay h-6 w-24 animate-pulse rounded-full" />
                </td>
                <td className="px-4 py-3">
                  <div className="bg-surface-overlay h-6 w-8 animate-pulse rounded-full" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
