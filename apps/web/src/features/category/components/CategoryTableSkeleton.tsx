const SKELETON_ROW_COUNT = 8;

export function CategoryTableSkeleton() {
  return (
    <div
      className="bg-surface border-primary-ring w-full overflow-hidden rounded-md border shadow-sm"
      role="status"
      aria-busy="true"
      aria-label="Loading categories table"
    >
      <table className="text-primary w-full border-collapse">
        <thead className="border-primary-ring border-b">
          <tr>
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
                <div className="bg-surface-overlay h-5 w-32 animate-pulse rounded-full" />
              </td>
              <td className="px-4 py-3">
                <div className="bg-surface-overlay h-5 w-16 animate-pulse rounded" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
