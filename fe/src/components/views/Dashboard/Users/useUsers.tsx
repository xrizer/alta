import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User } from '@/lib/types';
import * as userService from '@/services/user-service';

const useUsers = () => {
  const [selectedId, setSelectedId] = useState<string>('');

  const getUsers = async () => {
    const res = await userService.getUsers();
    if (!res.success) throw new Error(res.message);
    return res.data as User[];
  };

  const {
    data: users,
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  return {
    users,
    isLoading,
    isRefetching,
    error,
    refetch,
    selectedId,
    setSelectedId,
  };
};

export default useUsers;
