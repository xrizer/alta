'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as departmentsService from '@/services/department-service';
import * as companyService from '@/services/company-service';
import * as yup from 'yup';
import { Company } from '@/lib/types';

export const createDepartmentsSchema = yup.object({
  name: yup.string().required('Name is required'),
  company_id: yup.string().required('Company is required'),
  description: yup.string().required('Description is required'),
});

export type CreateDepartmentsPayload = yup.InferType<
  typeof createDepartmentsSchema
>;

const useCreateDepartments = () => {
  const router = useRouter();

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
  } = useForm<CreateDepartmentsPayload>({
    resolver: yupResolver(createDepartmentsSchema),
    defaultValues: {
      name: '',
      company_id: '',
      description: '',
    },
  });

  const createDepartments = async (payload: CreateDepartmentsPayload) => {
    const res = await departmentsService.createDepartment(payload);
    if (!res.success) {
      throw new Error(res.message);
    }

    return res;
  };

  const {
    mutate: mutateCreateDepartments,
    isPending: isPendingMutateCreateDepartments,
    isSuccess: isSuccessMutateCreateDepartments,
    error,
  } = useMutation({
    mutationFn: createDepartments,
    onSuccess: () => {
      router.push('/dashboard/companies');
    },
  });

  const handleCreateDepartments = (data: CreateDepartmentsPayload) =>
    mutateCreateDepartments(data);

  return {
    companies,
    control,
    errors,
    handleSubmitForm,
    handleCreateDepartments,
    isPendingMutateCreateDepartments,
    isSuccessMutateCreateDepartments,
    error,
    router,
  };
};

export default useCreateDepartments;
