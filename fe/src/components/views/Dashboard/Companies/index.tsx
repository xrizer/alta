'use client';

import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import useCompanies from './useCompanies';
import { DataTable } from '@/components/ui/data-table';
import { CompaniesColumn } from './Companies.column';
import { Input } from '@/components/ui/input';

export default function Companies() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { companies, isLoading } = useCompanies();

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

      <div className="flex justify-end">
        <Input
          icon={<Search width={18} color="#BFBFBF" />}
          placeholder="Search"
        />
      </div>

      <DataTable
        columns={CompaniesColumn}
        data={companies}
        filterKey="clientName"
        // totalPages={data.pagination.totalPage}
      />
    </div>
  );
}
