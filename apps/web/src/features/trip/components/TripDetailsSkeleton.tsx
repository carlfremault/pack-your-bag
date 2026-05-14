const SKELETON_ROW_COUNT = 6;

export default function TripDetailsSkeleton() {
  return (
    <div
      className="flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-4 p-4"
      role="status"
      aria-busy="true"
      aria-label="Loading trip details"
    >
      {/* Mobile TripDetailsCard */}
      <div className="flex flex-col gap-4 lg:hidden">
        <div className="bg-surface border-primary-ring flex min-h-0 flex-col gap-6 rounded-md border shadow-sm">
          <div className="flex items-start justify-between px-4 pt-4">
            <div className="flex items-start gap-2">
              <div
                className="bg-surface-overlay h-8 w-8 flex-none animate-pulse rounded"
                aria-hidden="true"
              />
              <div className="flex flex-col gap-1">
                <div
                  className="bg-surface-overlay h-6 w-40 animate-pulse rounded"
                  aria-hidden="true"
                />
                <div
                  className="bg-surface-overlay h-3 w-20 animate-pulse rounded"
                  aria-hidden="true"
                />
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div
                className="bg-surface-overlay h-6 w-10 animate-pulse rounded"
                aria-hidden="true"
              />
              <div
                className="bg-surface-overlay h-2 w-8 animate-pulse rounded"
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="px-4">
            <div
              className="bg-surface-overlay h-2 w-full animate-pulse rounded-full"
              aria-hidden="true"
            />
          </div>

          <div className="flex items-center justify-between px-4">
            <div
              className="bg-surface-overlay h-5 w-24 animate-pulse rounded-xl"
              aria-hidden="true"
            />
            <div className="flex flex-col items-end gap-2">
              <div
                className="bg-surface-overlay h-3 w-16 animate-pulse rounded"
                aria-hidden="true"
              />
              <div
                className="bg-surface-overlay h-3 w-20 animate-pulse rounded"
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 px-4 pb-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className="bg-surface-overlay h-5 w-5 flex-none animate-pulse rounded-full"
                    aria-hidden="true"
                  />
                  <div
                    className="bg-surface-overlay h-4 w-20 animate-pulse rounded-full"
                    aria-hidden="true"
                  />
                </div>
                <div
                  className="bg-surface-overlay h-3 w-8 animate-pulse rounded"
                  aria-hidden="true"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-none justify-end gap-8 p-4">
            <div className="bg-surface-overlay h-6 w-6 animate-pulse rounded" aria-hidden="true" />
            <div className="bg-surface-overlay h-6 w-6 animate-pulse rounded" aria-hidden="true" />
          </div>
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

      {/* Mobile item cards */}
      <div className="mb-32 flex w-full flex-col gap-2 lg:hidden" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface border-primary-ring flex w-full items-center gap-3 rounded-md border p-3 shadow-sm"
          >
            <div className="bg-surface-overlay h-5 w-5 flex-none animate-pulse rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="bg-surface-overlay h-4 w-16 animate-pulse rounded-full" />
              <div className="bg-surface-overlay h-4 w-32 animate-pulse rounded" />
              <div className="bg-surface-overlay h-3 w-12 animate-pulse rounded" />
            </div>
            <div className="bg-surface-overlay h-4 w-8 animate-pulse rounded" />
            <div className="bg-surface-overlay h-8 w-20 animate-pulse rounded" />
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden min-h-0 flex-1 lg:block">
        <div className="bg-surface border-primary-ring flex h-full w-full overflow-hidden rounded-md border shadow-sm">
          <div className="flex-1 overflow-y-auto">
            <table className="text-primary w-full border-collapse">
              <thead className="border-primary-ring border-b">
                <tr>
                  <th className="px-4 py-3 text-center text-xs font-semibold tracking-wide uppercase">
                    Ready
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                    Name
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold tracking-wide uppercase">
                    Weight
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold tracking-wide uppercase">
                    Category
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold tracking-wide uppercase">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold tracking-wide uppercase">
                    Packed
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
                      <div className="flex justify-center">
                        <div className="bg-surface-overlay h-5 w-5 animate-pulse rounded-full" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="bg-surface-overlay h-4 w-32 animate-pulse rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <div className="bg-surface-overlay h-4 w-16 animate-pulse rounded" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <div className="bg-surface-overlay h-6 w-24 animate-pulse rounded-full" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <div className="bg-surface-overlay h-4 w-12 animate-pulse rounded" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <div className="bg-surface-overlay h-8 w-20 animate-pulse rounded" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
