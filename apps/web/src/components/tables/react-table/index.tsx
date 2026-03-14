import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';

type SimpleTableProps<T> = {
  data: Array<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[];
};

export default function ReactTable<T>(props: SimpleTableProps<T>) {
  const { data, columns } = props;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!data.length) return <div>No data</div>;

  return (
    <table className="w-full border-collapse border border-gray-300">
      <thead className="border-collapse border border-gray-300 bg-gray-100">
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id} className="p-2" scope="col" style={{ width: header.getSize() }}>
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
          <tr key={row.id} className={row.index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className="border-r border-gray-300 p-2">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
