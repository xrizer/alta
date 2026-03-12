'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
} from '@/components/ui/table';

import Typography from './typography';
import { LIMIT_LISTS } from '@/constants/list.constant';
import { cn } from '@/lib/utils';
import { TablePagination } from './pagination-table';
import useChangeUrl from '@/hooks/useChangeUrl';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filterKey?: string;
  hiddenHintFooter?: boolean;
  totalPages?: number;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  hiddenHintFooter,
  totalPages,
}: // filterKey,
DataTableProps<TData, TValue>) {
  const { handleChangePage, currentPage } = useChangeUrl();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      {/* Filter
      {filterKey && (
        <div className="flex items-center py-4">
          <Input
            placeholder={`Filter ${filterKey}...`}
            value={
              (table.getColumn(filterKey)?.getFilterValue() as string) ?? ''
            }
            onChange={(e) =>
              table.getColumn(filterKey)?.setFilterValue(e.target.value)
            }
            className="max-w-sm"
          />
        </div>
      )} */}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border  ">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center h-24">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={columns.length}>
                <div
                  className={cn(
                    'flex items-center w-full py-1',
                    hiddenHintFooter ? 'justify-start' : 'justify-between',
                  )}>
                  {!hiddenHintFooter && (
                    <Typography variant="caption">
                      Showing 1 to 5 of 5 results
                    </Typography>
                  )}

                  {/* Pagination */}
                  <div className={cn(hiddenHintFooter ? 'mr-auto' : '')}>
                    <TablePagination
                      page={Number(currentPage!)}
                      totalPages={totalPages!}
                      onChange={handleChangePage}
                    />
                  </div>

                  <div className="flex flex-row items-center gap-3 border border-input pl-4 shadow-xs py-0 rounded-md">
                    <Typography variant="caption">Page per Row</Typography>
                    <Select>
                      <SelectTrigger className="w-[68px] rounded-l-none! border-y-0! border-r-0">
                        <SelectValue placeholder="10" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {LIMIT_LISTS.map((limit) => (
                            <SelectItem
                              key={limit.value}
                              value={limit.value.toString()}>
                              {limit.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
