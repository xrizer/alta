import Link from 'next/link';
import Typography from '@/components/ui/typography';
import { ColumnDef } from '@tanstack/react-table';
import { SquarePen, Trash } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import DeleteDepartmentsModal from './DeleteUsersModal';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export type Users = {
  id: string;
  name: string;
  role: string;
  is_active: boolean;
};

const roleConfig: Record<string, { label: string; style: string }> = {
  superadmin: {
    label: 'Superadmin',
    style: 'bg-primary-surface text-error',
  },
  admin: {
    label: 'Administrator',
    style: 'bg-primary-surface text-primary',
  },
  hr: {
    label: 'HR',
    style: 'bg-[#CBE2F7] text-secondary',
  },
  employee: {
    label: 'Employee',
    style: 'bg-input text-divider',
  },
};

export const UsersColumn: ColumnDef<Users>[] = [
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
    accessorKey: 'email',
    header: () => <Typography variant="bodyBold">Email</Typography>,
    cell: ({ row }) => (
      <Typography variant="bodyRegular">{row.getValue('email')}</Typography>
    ),
  },
  {
    accessorKey: 'role',
    header: () => <Typography variant="bodyBold">Role</Typography>,
    cell: ({ row }) => {
      const roleKey = row.original.role?.toLowerCase();

      const config = roleConfig[roleKey] || {
        label: 'Employee',
        style: 'bg-gray-100 text-gray-800',
      };

      return (
        <span
          className={`inline-flex rounded-full px-3 py-0.5 text-xs font-semibold leading-5 ${config.style}`}>
          {config.label}
        </span>
      );
    },
  },
  {
    accessorKey: 'phone',
    header: () => <Typography variant="bodyBold">Phone</Typography>,
    cell: ({ row }) => (
      <Typography variant="bodyRegular">{row.getValue('phone')}</Typography>
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
            href={`/dashboard/users/${row.original.id}/edit`}
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
              <DeleteDepartmentsModal id={row.original.id} />
            </DialogContent>
          </Dialog>
        </div>
      );
    },
  },
];
