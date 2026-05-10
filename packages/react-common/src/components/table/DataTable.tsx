import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  Row,
  useReactTable,
} from '@tanstack/react-table';
import classNames from 'classnames';

export type DataTableProps<T> = {
  data: Array<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[];
  getSubRows?: (originalRow: T, index: number) => T[] | undefined;
  getRowId?: (originalRow: T, index: number, parent?: Row<T>) => string;
  emptyStateLabel?: string;
  scrollable?: boolean;
};

export function DataTable<T>(props: DataTableProps<T>) {
  // Known incompatibility issue between React Compiler and TanStack Table v8
  // TODO: upgrade to TanStack Table v9 when it's released
  'use no memo';

  const {
    data,
    columns,
    getSubRows,
    getRowId,
    emptyStateLabel = 'No data',
    scrollable = false,
  } = props;

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows,
    getRowId,
  });

  if (!data.length) {
    return (
      <div className="bg-surface border-primary-ring text-primary rounded-md border p-6 text-center text-sm">
        {emptyStateLabel}
      </div>
    );
  }

  return (
    <div
      className={classNames(
        'bg-surface border-primary-ring text-primary w-full overflow-hidden rounded-md border shadow-sm',
        scrollable && 'flex h-full',
      )}
    >
      <div className={classNames(scrollable && 'flex-1 overflow-y-auto')}>
        <table className="w-full table-fixed border-collapse">
          <thead
            className={classNames(
              'border-primary-ring border-b',
              scrollable && 'bg-surface sticky top-0 z-10',
            )}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase"
                    scope="col"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={classNames(
                  row.depth > 0 || row.getIsExpanded()
                    ? 'bg-primary-ring/50'
                    : row.index % 2 === 0
                      ? 'bg-surface'
                      : 'bg-surface-overlay/90',
                )}
              >
                {row.getVisibleCells().map((cell, cellIndex) => (
                  <td
                    key={cell.id}
                    className={classNames(
                      'py-3 text-sm',
                      row.depth > 0 && cellIndex === 0
                        ? 'border-primary-ring border-l-4 pr-4 pl-8'
                        : 'px-4',
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
