import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Position } from '@/lib/types';
import * as positionService from '@/services/position-service';
const usePositions = () => {
  const [selectedId, setSelectedId] = useState<string>('');

  const getPositions = async () => {
    const res = await positionService.getPositions();
    if (!res.success) throw new Error(res.message);
    return res.data as Position[];
  };

  const {
    data: positions,
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useQuery({
    queryKey: ['positions'],
    queryFn: getPositions,
  });

  return {
    positions,
    isLoading,
    isRefetching,
    error,
    refetch,
    selectedId,
    setSelectedId,
  };
};

export default usePositions;
