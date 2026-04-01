import { useContext } from 'react';
import * as positionsService from '@/services/position-service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ToasterContext } from '@/contexts/ToasterContext';

const useDeletePositionsModal = () => {
  const queryClient = useQueryClient();
  const { setToaster } = useContext(ToasterContext);

  const deletePositions = async (id: string) => {
    const res = await positionsService.deletePosition(id);

    return res;
  };

  const {
    mutate: mutateDeletePositions,
    isPending: isPendingMutateDeletePositions,
    isSuccess: isSuccessMutateDeletePositions,
  } = useMutation({
    mutationFn: deletePositions,
    onSuccess: () => {
      setToaster({
        type: 'success',
        message: 'Success delete position',
      });

      queryClient.invalidateQueries({
        queryKey: ['positions'],
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
    mutateDeletePositions,
    isPendingMutateDeletePositions,
    isSuccessMutateDeletePositions,
  };
};

export default useDeletePositionsModal;
