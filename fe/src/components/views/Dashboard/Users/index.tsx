'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import useUsers from './useUsers';
import { DataTable } from '@/components/ui/data-table';
import { UsersColumn } from './Users.column';

export default function Users() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { users, isLoading } = useUsers();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Users</h2>
          <p className="mt-1 text-sm text-gray-600">Manage Users data</p>
        </div>

        {isAdmin && (
          <Link href="/dashboard/users/create">
            <Button>
              <Plus />
              Add User
            </Button>
          </Link>
        )}
      </div>

      <DataTable
        columns={UsersColumn}
        data={users ?? []}
        filterKey="departmentsName"
        // totalPages={data.pagination.totalPage}
      />
    </div>
  );
}
