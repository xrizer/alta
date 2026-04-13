'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as companyService from '@/services/company-service';
import * as shiftsService from '@/services/shift-service';
import * as yup from 'yup';
import { Company } from '@/lib/types';
import { useContext } from 'react';
import { ToasterContext } from '@/contexts/ToasterContext';

export const createShiftSchema = yup.object({
  company_id: yup.string().required('Company ID wajib diisi'),

  name: yup
    .string()
    .required('Nama wajib diisi')
    .min(3, 'Nama minimal 3 karakter'),

  start_time: yup.string().required('Waktu mulai wajib diisi'),

  end_time: yup.string().required('Waktu selesai wajib diisi'),
});

export type CreateShiftsPayload = yup.InferType<typeof createShiftSchema>;

const useCreateShifts = () => {
  const router = useRouter();
  const { setToaster } = useContext(ToasterContext);

  const getCompanies = async () => {
    const res = await companyService.getCompanies();
    if (!res.success) throw new Error(res.message);
    return res.data?.data as Company[];
  };

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: getCompanies,
    initialData: [],
  });

  const {
    control,
    handleSubmit: handleSubmitForm,
    formState: { errors },
  } = useForm<CreateShiftsPayload>({
    resolver: yupResolver(createShiftSchema),
    defaultValues: {
      company_id: '',
      name: '',
      start_time: '',
      end_time: '',
    },
  });

  const createShifts = async (payload: CreateShiftsPayload) => {
    const res = await shiftsService.createShift(payload);
    if (!res.success) {
      throw new Error(res.message);
    }

    return res;
  };

  const {
    mutate: mutateCreateShifts,
    isPending: isPendingMutateCreateShifts,
    isSuccess: isSuccessMutateCreateShifts,
    error,
  } = useMutation({
    mutationFn: createShifts,
    onSuccess: () => {
      setToaster({
        type: 'success',
        message: 'Success create shift',
      });
      router.push('/dashboard/shifts');
    },
  });

  const handleCreateShifts = (data: CreateShiftsPayload) =>
    mutateCreateShifts(data);

  return {
    companies,
    control,
    errors,
    handleSubmitForm,
    handleCreateShifts,
    isPendingMutateCreateShifts,
    isSuccessMutateCreateShifts,
    error,
    router,
  };
};

export default useCreateShifts;
