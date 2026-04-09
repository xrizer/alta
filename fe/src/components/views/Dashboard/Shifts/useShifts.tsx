import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shift } from '@/lib/types';
import * as shiftService from '@/services/shift-service';

const useShifts = () => {
  const [selectedId, setSelectedId] = useState<string>('');

  const getShifts = async () => {
    const res = await shiftService.getShifts();
    if (!res.success) throw new Error(res.message);
    return res.data as Shift[];
  };

  const {
    data: shifts,
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useQuery({
    queryKey: ['shifts'],
    queryFn: getShifts,
  });

  return {
    shifts,
    isLoading,
    isRefetching,
    error,
    refetch,
    selectedId,
    setSelectedId,
  };
};

export default useShifts;
