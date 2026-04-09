'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import useShifts from './useShifts';
import { DataTable } from '@/components/ui/data-table';
import { ShiftsColumn } from './Shifts.column';

export default function Shifts() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { shifts, isLoading } = useShifts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading shifts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Shifts</h2>
          <p className="mt-1 text-sm text-gray-600">Manage Shifts data</p>
        </div>

        {isAdmin && (
          <Link href="/dashboard/shifts/create">
            <Button>
              <Plus />
              Add Shifts
            </Button>
          </Link>
        )}
      </div>

      <DataTable
        columns={ShiftsColumn}
        data={shifts ?? []}
        filterKey="departmentsName"
        // totalPages={data.pagination.totalPage}
      />
    </div>
  );
}
