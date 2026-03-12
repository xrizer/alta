import { useContext } from 'react';
import * as companyService from '@/services/company-service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ToasterContext } from '@/contexts/ToasterContext';

const useDeleteDepartmentsModal = () => {
  const queryClient = useQueryClient();
  const { setToaster } = useContext(ToasterContext);

  const deleteBanner = async (id: string) => {
    const res = await companyService.deleteCompany(id);

    return res;
  };

  const {
    mutate: mutateDeleteCompanies,
    isPending: isPendingMutateDeleteCompanies,
    isSuccess: isSuccessMutateDeleteCompanies,
  } = useMutation({
    mutationFn: deleteBanner,
    onSuccess: () => {
      setToaster({
        type: 'success',
        message: 'Success delete company',
      });

      queryClient.invalidateQueries({
        queryKey: ['companies'],
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
    mutateDeleteCompanies,
    isPendingMutateDeleteCompanies,
    isSuccessMutateDeleteCompanies,
  };
};

export default useDeleteDepartmentsModal;
