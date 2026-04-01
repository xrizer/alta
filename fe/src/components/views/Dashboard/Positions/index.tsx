'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import usePositions from './usePositions';
import { DataTable } from '@/components/ui/data-table';
import { PositionsColumn } from './Positions.column';

export default function Positions() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { positions, isLoading } = usePositions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading positions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Positions</h2>
          <p className="mt-1 text-sm text-gray-600">Manage Positions data</p>
        </div>

        {isAdmin && (
          <Link href="/dashboard/positions/create">
            <Button>
              <Plus />
              Add Positions
            </Button>
          </Link>
        )}
      </div>

      <DataTable
        columns={PositionsColumn}
        data={positions ?? []}
        filterKey="name"
        // totalPages={data.pagination.totalPage}
      />
    </div>
  );
}
