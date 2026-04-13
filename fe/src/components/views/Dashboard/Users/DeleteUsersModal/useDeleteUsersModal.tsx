import { useContext } from 'react';
import * as userService from '@/services/user-service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ToasterContext } from '@/contexts/ToasterContext';

const useDeleteUsersModal = () => {
  const queryClient = useQueryClient();
  const { setToaster } = useContext(ToasterContext);

  const deletUser = async (id: string) => {
    const res = await userService.deleteUser(id);

    return res;
  };

  const {
    mutate: mutateDeleteUser,
    isPending: isPendingMutateDeleteUser,
    isSuccess: isSuccessMutateDeleteUser,
  } = useMutation({
    mutationFn: deletUser,
    onSuccess: () => {
      setToaster({
        type: 'success',
        message: 'Success delete user',
      });

      queryClient.invalidateQueries({
        queryKey: ['shifts'],
      });
    },
    onError: (error) => {
      setToaster({
        type: 'error',
        message: error.message,
      });
    },
  });

  return {
    mutateDeleteUser,
    isPendingMutateDeleteUser,
    isSuccessMutateDeleteUser,
  };
};

export default useDeleteUsersModal;
