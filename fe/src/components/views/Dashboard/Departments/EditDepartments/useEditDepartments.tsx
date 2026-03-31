'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as companyService from '@/services/company-service';
import * as departmentsService from '@/services/department-service';
import * as yup from 'yup';
import { Company } from '@/lib/types';
import { useContext } from 'react';
import { ToasterContext } from '@/contexts/ToasterContext';

export const editDepartmentSchema = yup.object({
  name: yup.string().required('Name is required'),
  company_id: yup.string().required('Company is required'),
  description: yup.string().required('Description is required'),
});

export type EditDepartmentPayload = yup.InferType<typeof editDepartmentSchema>;

const useEditDepartments = () => {
  const router = useRouter();
  const params = useParams();
  const { setToaster } = useContext(ToasterContext);
  const departmentId = params.id as string;

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
  } = useForm<EditDepartmentPayload>({
    resolver: yupResolver(editDepartmentSchema),
    defaultValues: {
      name: '',
      company_id: '',
      description: '',
    },
  });

  const fetchDepartment = async () => {
    const res = await departmentsService.getDepartmentById(departmentId);

    if (!res.success) {
      throw new Error(res.message);
    }
    return res.data;
  };

  const { data: department, isLoading: isLoadingDepartment } = useQuery({
    queryKey: ['department', departmentId],
    queryFn: fetchDepartment,
  });

  useEffect(() => {
    if (department && companies && companies.length > 0) {
      reset({
        name: department.name || '',
        company_id: department.company_id || '',
        description: department.description || '',
      });
    }
  }, [department, companies, reset]);

  const updateDepartment = async (payload: EditDepartmentPayload) => {
    console.log('Payload ke API:', payload);
    const res = await departmentsService.updateDepartment(
      departmentId,
      payload,
    );
    if (!res.success) {
      throw new Error(res.message);
    }
    return res;
  };

  const {
    mutate: mutateUpdateDepartment,
    isPending: isPendingMutateUpdateDepartment,
  } = useMutation({
    mutationFn: updateDepartment,

    onSuccess: () => {
      setToaster({
        type: 'success',
        message: 'Success edit department',
      });
      router.push('/dashboard/departments');
    },
  });

  const handleUpdateDepartment = (data: EditDepartmentPayload) => {
    console.log('Payload yang dikirim:', data);
    mutateUpdateDepartment(data);
  };

  return {
    control,
    errors,
    companies,
    handleSubmitForm,
    handleUpdateDepartment,
    isPendingMutateUpdateDepartment,
    isLoadingDepartment,
    router,
  };
};

export default useEditDepartments;
