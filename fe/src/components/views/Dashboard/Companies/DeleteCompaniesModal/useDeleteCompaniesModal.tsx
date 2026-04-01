import { useContext } from 'react';
import * as companyService from '@/services/company-service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ToasterContext } from '@/contexts/ToasterContext';

const useDeleteCompaniesModal = () => {
  const queryClient = useQueryClient();
  const { setToaster } = useContext(ToasterContext);

  const deleteCompany = async (id: string) => {
    const res = await companyService.deleteCompany(id);

    return res;
  };

  const {
    mutate: mutateDeleteCompanies,
    isPending: isPendingMutateDeleteCompanies,
    isSuccess: isSuccessMutateDeleteCompanies,
  } = useMutation({
    mutationFn: deleteCompany,
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

export default useDeleteCompaniesModal;
