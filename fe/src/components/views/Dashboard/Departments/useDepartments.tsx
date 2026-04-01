import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Department } from '@/lib/types';
import * as departmentService from '@/services/department-service';

const useDepartments = () => {
  const [selectedId, setSelectedId] = useState<string>('');

  const getDepartments = async () => {
    const res = await departmentService.getDepartments();
    if (!res.success) throw new Error(res.message);
    return res.data as Department[];
  };

  const {
    data: departments,
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
  });

  return {
    departments,
    isLoading,
    isRefetching,
    error,
    refetch,
    selectedId,
    setSelectedId,
  };
};

export default useDepartments;
