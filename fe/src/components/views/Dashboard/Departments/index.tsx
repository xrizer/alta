'use client';

import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import useDepartments from './useDepartments';
import { DataTable } from '@/components/ui/data-table';
import { DepartmensColumn } from './Departments.column';
import { Input } from '@/components/ui/input';

export default function Departments() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { departments, isLoading } = useDepartments();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading departments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Departmens</h2>
          <p className="mt-1 text-sm text-gray-600">Manage Departmens data</p>
        </div>

        {isAdmin && (
          <Link href="/dashboard/departments/create">
            <Button>
              <Plus />
              Add Departmens
            </Button>
          </Link>
        )}
      </div>

      <div className="flex justify-end">
        <Input
          icon={<Search width={18} color="#BFBFBF" />}
          placeholder="Search"
        />
      </div>

      <DataTable
        columns={DepartmensColumn}
        data={departments}
        filterKey="departmentsName"
        // totalPages={data.pagination.totalPage}
      />
    </div>
  );
}
