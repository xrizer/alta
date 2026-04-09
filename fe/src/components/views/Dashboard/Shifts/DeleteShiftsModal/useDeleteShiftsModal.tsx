import { useContext } from 'react';
import * as shiftsService from '@/services/shift-service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ToasterContext } from '@/contexts/ToasterContext';

const useDeleteShiftsModal = () => {
  const queryClient = useQueryClient();
  const { setToaster } = useContext(ToasterContext);

  const deleteShift = async (id: string) => {
    const res = await shiftsService.deleteShift(id);

    return res;
  };

  const {
    mutate: mutateDeleteShift,
    isPending: isPendingMutateDeleteShift,
    isSuccess: isSuccessMutateDeleteShift,
  } = useMutation({
    mutationFn: deleteShift,
    onSuccess: () => {
      setToaster({
        type: 'success',
        message: 'Success delete shift',
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
    mutateDeleteShift,
    isPendingMutateDeleteShift,
    isSuccessMutateDeleteShift,
  };
};

export default useDeleteShiftsModal;
