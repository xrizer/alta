import Link from 'next/link';
import Typography from '@/components/ui/typography';
import { ColumnDef } from '@tanstack/react-table';
import { SquarePen, Trash } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import DeletePositionsModal from './DeletePositionsModal';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { convertIDR } from '@/lib/utils';

export type Positions = {
  id: string;
  name: string;
  company?: {
    name: string;
  };
  department?: {
    name: string;
  };
  base_salary: number;
  is_active: boolean;
};

export const PositionsColumn: ColumnDef<Positions>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: () => <Typography variant="bodyBold">Name</Typography>,
    cell: ({ row }) => <div>{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'company',
    header: () => <Typography variant="bodyBold">Company</Typography>,
    cell: ({ row }) => (
      <Typography variant="bodyRegular">
        {row.original.company?.name}
      </Typography>
    ),
  },
  {
    accessorKey: 'department',
    header: () => <Typography variant="bodyBold">Department</Typography>,
    cell: ({ row }) => (
      <Typography variant="bodyRegular">
        {row.original.department?.name}
      </Typography>
    ),
  },
  {
    accessorKey: 'base_salary',
    header: () => <Typography variant="bodyBold">Base Salary</Typography>,
    cell: ({ row }) => (
      <Typography variant="bodyRegular">
        {convertIDR(row.getValue('base_salary'))}
      </Typography>
    ),
  },
  {
    accessorKey: 'status',
    header: () => <Typography variant="bodyBold">Status</Typography>,
    cell: ({ row }) => (
      <span
        className={`inline-flex rounded-full px-3 py-0.5 text-xs font-semibold leading-5 ${
          row.original.is_active
            ? 'bg-[#C7FBDD] text-[#2ECC71]'
            : 'bg-red-100 text-red-800'
        }`}>
        {row.original.is_active ? 'Active' : 'Inactive'}
      </span>
    ),
  },
  {
    id: 'actions',
    enableHiding: false,
    header: () => <Typography variant="bodyBold">Action</Typography>,

    cell: ({ row }) => {
      return (
        <div className="flex space-x-3 items-center">
          <Link
            href={`/dashboard/positions/${row.original.id}/edit`}
            className="text-secondary hover:text-secondary/90 flex gap-2 font-medium items-center">
            <SquarePen width={20} color="#1890FF" /> Edit
          </Link>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="icon"
                className="px-0 text-[14px] text-error flex gap-2">
                <Trash width={20} color="#FF4D4F" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle></DialogTitle>
              <DeletePositionsModal id={row.original.id} />
            </DialogContent>
          </Dialog>
        </div>
      );
    },
  },
];
