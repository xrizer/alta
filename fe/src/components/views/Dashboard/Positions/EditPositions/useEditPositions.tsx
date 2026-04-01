'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as companyService from '@/services/company-service';
import * as departmentsService from '@/services/department-service';
import * as positionsService from '@/services/position-service';
import * as yup from 'yup';
import { Company, Department } from '@/lib/types';
import { useContext } from 'react';
import { ToasterContext } from '@/contexts/ToasterContext';

export const editDepartmentSchema = yup.object({
  name: yup.string().required('Name is required'),
  company_id: yup.string().required('Company is required'),
  department_id: yup.string().required('Department is required'),
  base_salary: yup.number().required('Base Salary is required'),
});

export type EditPositionPayload = yup.InferType<typeof editDepartmentSchema>;

const useEditPositions = () => {
  const router = useRouter();
  const params = useParams();
  const { setToaster } = useContext(ToasterContext);
  const positionsId = params.id as string;

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
    reset,
  } = useForm<EditPositionPayload>({
    resolver: yupResolver(editDepartmentSchema),
    defaultValues: {
      company_id: '',
      department_id: '',
      name: '',
      base_salary: 0,
    },
  });

  const getPositionById = async () => {
    const res = await positionsService.getPositionById(positionsId);

    if (!res.success) {
      throw new Error(res.message);
    }
    return res.data;
  };

  const { data: position, isLoading: isLoadingPosition } = useQuery({
    queryKey: ['position', positionsId],
    queryFn: getPositionById,
  });

  useEffect(() => {
    if (position) {
      reset({
        name: position.name || '',
        company_id: position.company_id || '',
        department_id: position.department_id || '',
        base_salary: position.base_salary || 0,
      });
    }
  }, [position, companies, reset]);

  const updatePosition = async (payload: EditPositionPayload) => {
    const res = await positionsService.updatePosition(positionsId, payload);
    if (!res.success) {
      throw new Error(res.message);
    }
    return res;
  };

  const {
    mutate: mutateUpdatePosition,
    isPending: isPendingMutateUpdatePosition,
  } = useMutation({
    mutationFn: updatePosition,

    onSuccess: () => {
      setToaster({
        type: 'success',
        message: 'Success edit position',
      });
      router.push('/dashboard/positions');
    },
  });

  const handleUpdatePosition = (data: EditPositionPayload) => {
    mutateUpdatePosition(data);
  };

  return {
    control,
    errors,
    companies,
    departments,
    handleSubmitForm,
    handleUpdatePosition,
    isPendingMutateUpdatePosition,
    isLoadingPosition,
    router,
  };
};

export default useEditPositions;
