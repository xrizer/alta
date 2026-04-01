'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as departmentsService from '@/services/department-service';
import * as companyService from '@/services/company-service';
import * as positionsService from '@/services/position-service';
import * as yup from 'yup';
import { Company, Department } from '@/lib/types';
import { useContext } from 'react';
import { ToasterContext } from '@/contexts/ToasterContext';

export const createPositionsSchema = yup.object({
  name: yup.string().required('Name is required'),
  company_id: yup.string().required('Company is required'),
  department_id: yup.string().required('Department is required'),
  base_salary: yup.number().required('Base Salary is required'),
});

export type CreatePositionsPayload = yup.InferType<
  typeof createPositionsSchema
>;

const useCreatePositions = () => {
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

  const getDepartmens = async () => {
    const res = await departmentsService.getDepartments();
    if (!res.success) throw new Error(res.message);
    return res.data as Department[];
  };

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartmens,
    initialData: [],
  });

  const {
    control,
    handleSubmit: handleSubmitForm,
    formState: { errors },
  } = useForm<CreatePositionsPayload>({
    resolver: yupResolver(createPositionsSchema),
    defaultValues: {
      company_id: '',
      department_id: '',
      name: '',
      base_salary: 0,
    },
  });

  const createPositions = async (payload: CreatePositionsPayload) => {
    const res = await positionsService.createPosition(payload);
    if (!res.success) {
      throw new Error(res.message);
    }

    return res;
  };

  const {
    mutate: mutateCreatePositions,
    isPending: isPendingMutateCreatePositions,
    isSuccess: isSuccessMutateCreatePositions,
    error,
  } = useMutation({
    mutationFn: createPositions,
    onSuccess: () => {
      setToaster({
        type: 'success',
        message: 'Success create position',
      });
      router.push('/dashboard/positions');
    },
  });

  const handleCreatePositions = (data: CreatePositionsPayload) =>
    mutateCreatePositions(data);

  return {
    companies,
    departments,
    control,
    errors,
    handleSubmitForm,
    handleCreatePositions,
    isPendingMutateCreatePositions,
    isSuccessMutateCreatePositions,
    error,
    router,
  };
};

export default useCreatePositions;
