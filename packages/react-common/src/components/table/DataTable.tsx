import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';

type DataTableProps<T> = {
  data: Array<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[];
  emptyStateLabel?: string;
};

export function DataTable<T>(props: DataTableProps<T>) {
  // Known incompatibility issue between React Compiler and TanStack Table v8
  // TODO: upgrade to TanStack Table v9 when it's released
  'use no memo';

  const { data, columns, emptyStateLabel = 'No data' } = props;

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!data.length) {
    return (
      <div className="bg-surface border-primary-ring text-primary rounded-md border p-6 text-center text-sm">
        {emptyStateLabel}
      </div>
    );
  }

  return (
    <div className="bg-surface border-primary-ring w-full overflow-x-auto rounded-md border shadow-sm">
      <table className="text-primary w-full border-collapse">
        <thead className="border-primary-ring border-b">
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
              className={row.index % 2 === 0 ? 'bg-surface' : 'bg-surface-overlay/70'}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 text-sm">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
