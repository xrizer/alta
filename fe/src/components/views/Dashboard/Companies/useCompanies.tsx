import * as companyService from '@/services/company-service';
import useChangeUrl from '@/hooks/useChangeUrl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RowSelectionState } from '@tanstack/react-table';
import { useState } from 'react';
import { useContext } from 'react';
import { ToasterContext } from '@/contexts/ToasterContext';

const useCompanies = () => {
  const queryClient = useQueryClient();
  const { setToaster } = useContext(ToasterContext);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const { currentLimit, currentPage, currentSearch } = useChangeUrl();

  const selectedIds = Object.keys(rowSelection).filter(
    (id) => rowSelection[id],
  );

  const getCompanies = async () => {
    const res = await companyService.getCompanies({
      page: Number(currentPage),
      limit: Number(currentLimit),
      search: currentSearch || undefined,
    });

    return res.data;
  };

  const {
    data: companies,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['companies', currentPage, currentLimit, currentSearch],
    queryFn: getCompanies,
    enabled: !!currentPage && !!currentLimit,
  });

  const handleMultipleDelete = async () => {
    if (selectedIds.length === 0) return;
    const res = await companyService.deleteMultipleCompanies(selectedIds);
    return res;
  };

  const { mutate: mutateDeleteCompanies } = useMutation({
    mutationFn: handleMultipleDelete,
    onError: (error) => {
      setToaster({
        type: 'error',
        message: error.message,
      });
    },
    onSuccess: () => {
      setToaster({
        type: 'success',
        message: 'Delete companies success',
      });
      setRowSelection({});
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  return {
    mutateDeleteCompanies,
    setRowSelection,
    selectedIds,
    companies,
    rowSelection,
    isLoading,
    isRefetching,
    refetch,
  };
};

export default useCompanies;
