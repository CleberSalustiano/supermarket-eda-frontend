import type { ReactNode } from 'react';

import { cn } from '../cn';

export interface DataTableColumn<Row> {
  key: string;
  header: string;
  render: (row: Row) => ReactNode;
  align?: 'left' | 'right';
}

export interface DataTableProps<Row> {
  columns: ReadonlyArray<DataTableColumn<Row>>;
  rows: ReadonlyArray<Row>;
  rowKey: (row: Row) => string;
  caption?: string;
}

export function DataTable<Row>({ columns, rows, rowKey, caption }: DataTableProps<Row>) {
  return (
    <table className="w-full border-collapse text-left text-body text-ink">
      {caption === undefined ? null : <caption className="pb-2 text-left text-heading">{caption}</caption>}
      <thead>
        <tr className="border-b border-rule">
          {columns.map((column) => (
            <th
              key={column.key}
              scope="col"
              className={cn('px-2 py-2 text-small font-bold', column.align === 'right' && 'text-right')}
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={rowKey(row)} className="border-b border-rule">
            {columns.map((column) => (
              <td
                key={column.key}
                className={cn('px-2 py-2', column.align === 'right' && 'text-right tabular-nums')}
              >
                {column.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
