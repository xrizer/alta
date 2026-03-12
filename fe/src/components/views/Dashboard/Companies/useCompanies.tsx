import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as companyService from '@/services/company-service';
import { Company } from '@/lib/types';

const useCompanies = () => {
  const [selectedId, setSelectedId] = useState<string>('');

  const getCompanies = async () => {
    const res = await companyService.getCompanies();
    if (!res.success) throw new Error(res.message);
    return res.data as Company[];
  };

  const {
    data: companies,
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useQuery({
    queryKey: ['companies'],
    queryFn: getCompanies,
  });

  return {
    companies,
    isLoading,
    isRefetching,
    error,
    refetch,
    selectedId,
    setSelectedId,
  };
};

export default useCompanies;
