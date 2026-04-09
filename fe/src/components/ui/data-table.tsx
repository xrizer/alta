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
  RowSelectionState,
  OnChangeFn,
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
import { Input } from './input';
import { Search, Trash, X } from 'lucide-react';
import { Button } from './button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filterKey?: string;
  hiddenHintFooter?: boolean;
  totalPages?: number;
  totalItems?: number;
  limit?: number;
  page?: number;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  getRowId?: (row: TData) => string;
  selectedIds?: string[];
  onDeleteSelected?: () => void;
  onClearSelection?: () => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  hiddenHintFooter,
  totalPages,
  totalItems,
  limit,
  page,
  rowSelection = {},
  onRowSelectionChange,
  getRowId,
  selectedIds = [],
  onDeleteSelected,
  onClearSelection,
}: // filterKey,
DataTableProps<TData, TValue>) {
  const {
    handleChangePage,
    handleChangeLimit,
    handleSearch,
    currentSearch,
    currentPage,
    currentLimit,
  } = useChangeUrl();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  // const [rowSelection, setRowSelection] = React.useState({});

  const start = totalItems ? (page! - 1) * limit! + 1 : 0;
  const end = totalItems ? Math.min(page! * limit!, totalItems) : 0;

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
    // onRowSelectionChange: setRowSelection,
    getRowId,
    onRowSelectionChange,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full space-y-4">
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

      {/* Search */}
      <div className="flex justify-end">
        <Input
          icon={<Search width={18} color="#BFBFBF" />}
          placeholder="Search"
          defaultValue={currentSearch}
          onChange={handleSearch}
        />
      </div>

      {/* multiple delete box*/}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between flex-row 3 px-3 py-1 md:py-0 bg-gray-100 rounded-lg border border-gray-400">
          <Typography>{selectedIds.length} item dipilih</Typography>
          <div className="flex gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant={'icon'}
                  size="icon"
                  className="flex gap-2 items-center text-error">
                  <Trash width={20} />
                  <span className="hidden md:block">Hapus</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Dialog</DialogTitle>
                <div className="flex justify-center flex-col items-center gap-6">
                  <Typography variant="h3">
                    Anda yakin ingin menghapus data?
                  </Typography>
                  <Typography
                    variant="bodyRegular"
                    className="text-secondary-text">
                    Setelah dihapus, data tidak bisa dipulihkan kembali.
                  </Typography>
                  <div className="space-x-5">
                    <DialogClose asChild>
                      <Button variant={'primary-outline'}>Batal</Button>
                    </DialogClose>
                    <Button variant={'primary'} onClick={onDeleteSelected}>
                      Hapus
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="icon" size="icon" onClick={onClearSelection}>
              <X width={20} className="block md:hidden" />
              <span className="hidden md:block">Batal</span>
            </Button>
          </div>
        </div>
      )}

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
                      Showing {start} to {end} of {totalItems} results
                      {/* Showing 1 to 5 of 5 results */}
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
                    <Select
                      value={currentLimit.toString()}
                      onValueChange={(value) => handleChangeLimit(value)}>
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
