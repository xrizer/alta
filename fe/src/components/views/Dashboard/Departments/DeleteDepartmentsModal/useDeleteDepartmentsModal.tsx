import { useContext } from 'react';
import * as departmentService from '@/services/department-service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ToasterContext } from '@/contexts/ToasterContext';

const useDeleteDepartmentsModal = () => {
  const queryClient = useQueryClient();
  const { setToaster } = useContext(ToasterContext);

  const deleteDepartment = async (id: string) => {
    const res = await departmentService.deleteDepartment(id);

    return res;
  };

  const {
    mutate: mutateDeleteDepartment,
    isPending: isPendingMutateDeleteDepartment,
    isSuccess: isSuccessMutateDeleteDepartment,
  } = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      setToaster({
        type: 'success',
        message: 'Success delete department',
      });

      queryClient.invalidateQueries({
        queryKey: ['departments'],
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
    mutateDeleteDepartment,
    isPendingMutateDeleteDepartment,
    isSuccessMutateDeleteDepartment,
  };
};

export default useDeleteDepartmentsModal;
