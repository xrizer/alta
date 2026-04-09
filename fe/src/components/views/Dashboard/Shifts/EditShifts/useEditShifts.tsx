'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as companyService from '@/services/company-service';
import * as shiftsService from '@/services/shift-service';
import * as yup from 'yup';
import { Company } from '@/lib/types';
import { useContext } from 'react';
import { ToasterContext } from '@/contexts/ToasterContext';

export const editDepartmentSchema = yup.object({
  company_id: yup.string().required('Company ID wajib diisi'),
  name: yup
    .string()
    .required('Nama wajib diisi')
    .min(3, 'Nama minimal 3 karakter'),
  start_time: yup.string().required('Waktu mulai wajib diisi'),
  end_time: yup.string().required('Waktu selesai wajib diisi'),
});

export type EditPositionPayload = yup.InferType<typeof editDepartmentSchema>;

const useEditPositions = () => {
  const router = useRouter();
  const params = useParams();
  const { setToaster } = useContext(ToasterContext);
  const shiftId = params.id as string;

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
    reset,
  } = useForm<EditPositionPayload>({
    resolver: yupResolver(editDepartmentSchema),
    defaultValues: {
      company_id: '',
      name: '',
      start_time: '',
      end_time: '',
    },
  });

  const getShiftById = async () => {
    const res = await shiftsService.getShiftById(shiftId);

    if (!res.success) {
      throw new Error(res.message);
    }
    return res.data;
  };

  const { data: shift, isLoading: isLoadingshift } = useQuery({
    queryKey: ['shift', shiftId],
    queryFn: getShiftById,
  });

  useEffect(() => {
    if (shift) {
      reset({
        company_id: shift.company_id || '',
        name: shift.name || '',
        start_time: shift.start_time || '',
        end_time: shift.end_time || '',
      });
    }
  }, [shift, companies, reset]);

  const updateShifts = async (payload: EditPositionPayload) => {
    const res = await shiftsService.updateShift(shiftId, payload);
    if (!res.success) {
      throw new Error(res.message);
    }
    return res;
  };

  const { mutate: mutateUpdateShifts, isPending: isPendingMutateUpdateShift } =
    useMutation({
      mutationFn: updateShifts,

      onSuccess: () => {
        setToaster({
          type: 'success',
          message: 'Success edit shift',
        });
        router.push('/dashboard/shifts');
      },
    });

  const handleUpdateShift = (data: EditPositionPayload) => {
    mutateUpdateShifts(data);
  };

  return {
    control,
    errors,
    companies,
    handleSubmitForm,
    handleUpdateShift,
    isPendingMutateUpdateShift,
    router,
  };
};

export default useEditPositions;
