'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { type Companies } from './Companies.column';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import useCompanies from './useCompanies';
import { DataTable } from '@/components/ui/data-table';
import { CompaniesColumn } from './Companies.column';

export default function Companies() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const {
    companies,
    isLoading,
    mutateDeleteCompanies,
    selectedIds,
    setRowSelection,
    rowSelection,
  } = useCompanies();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading companies...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Companies</h2>
          <p className="mt-1 text-sm text-gray-600">Manage company data</p>
        </div>

        {isAdmin && (
          <Link href="/dashboard/companies/create">
            <Button>
              <Plus />
              Add Company
            </Button>
          </Link>
        )}
      </div>

      <DataTable
        columns={CompaniesColumn}
        data={companies?.data || []}
        filterKey="clientName"
        totalPages={companies?.total_pages}
        totalItems={companies?.total_items}
        limit={companies?.limit}
        page={companies?.page}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        getRowId={(row) => (row as Companies).id}
        selectedIds={selectedIds}
        onDeleteSelected={() => mutateDeleteCompanies()}
        onClearSelection={() => setRowSelection({})}
      />
    </div>
  );
}
