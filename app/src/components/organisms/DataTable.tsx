"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onSort?: (key: string) => void;
  className?: string;
}

type SortDirection = "asc" | "desc" | null;

interface SortState {
  key: string;
  direction: SortDirection;
}

function SortIcon({ direction }: { direction: SortDirection }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="ml-1 inline-block shrink-0"
      aria-hidden="true"
    >
      <path
        d="M7 3L10 6H4L7 3Z"
        fill="currentColor"
        opacity={direction === "asc" ? 1 : 0.3}
      />
      <path
        d="M7 11L4 8H10L7 11Z"
        fill="currentColor"
        opacity={direction === "desc" ? 1 : 0.3}
      />
    </svg>
  );
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  onSort,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState>({ key: "", direction: null });

  function handleSort(key: string) {
    let nextDirection: SortDirection;
    if (sort.key !== key) {
      nextDirection = "asc";
    } else if (sort.direction === "asc") {
      nextDirection = "desc";
    } else {
      nextDirection = null;
    }

    setSort({ key: nextDirection ? key : "", direction: nextDirection });

    if (onSort && nextDirection) {
      onSort(key);
    }
  }

  return (
    <div className={cn("overflow-x-auto rounded-xl border border-border-default", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-default bg-bg-elevated">
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={cn(
                  "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary",
                  column.sortable && "cursor-pointer select-none hover:text-text-primary"
                )}
                onClick={column.sortable ? () => handleSort(String(column.key)) : undefined}
                aria-sort={
                  sort.key === String(column.key) && sort.direction
                    ? sort.direction === "asc"
                      ? "ascending"
                      : "descending"
                    : undefined
                }
              >
                <span className="inline-flex items-center">
                  {column.header}
                  {column.sortable && (
                    <SortIcon
                      direction={sort.key === String(column.key) ? sort.direction : null}
                    />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-default">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-text-secondary"
              >
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="bg-bg-surface transition-colors hover:bg-bg-elevated"
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className="whitespace-nowrap px-4 py-3 text-text-primary"
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : String(row[column.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
