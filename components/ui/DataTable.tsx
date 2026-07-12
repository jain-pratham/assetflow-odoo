import React from 'react';
import { cn } from '@/lib/utils';

export interface ColumnDef<TData> {
  header: string;
  accessorKey?: keyof TData;
  cell?: (item: TData) => React.ReactNode;
  className?: string;
}

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<TData>({ data, columns, isLoading, emptyMessage = "No data found.", className }: DataTableProps<TData>) {
  return (
    <div className={cn("w-full rounded-md border border-border bg-card", className)}>
      <div className="w-full overflow-visible min-h-[300px]">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className={cn("px-4 py-3 font-medium whitespace-nowrap", col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  <span className="ml-2">Loading...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-muted/50 transition-colors">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={cn("px-4 py-3", col.className)}>
                    {col.cell ? col.cell(item) : col.accessorKey ? String(item[col.accessorKey] ?? '') : ''}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
