'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useContext } from 'react';
import * as companyService from '@/services/company-service';
import * as yup from 'yup';
import { ToasterContext } from '@/contexts/ToasterContext';

export const editCompanySchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email'),
  phone: yup.string(),
  npwp: yup.string(),
  address: yup.string(),
  is_active: yup.boolean(),
});

export type EditCompanyPayload = yup.InferType<typeof editCompanySchema>;

const useEditCompanies = () => {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;
  const { setToaster } = useContext(ToasterContext);
  const {
    control,
    handleSubmit: handleSubmitForm,
    formState: { errors },
    reset,
  } = useForm<EditCompanyPayload>({
    resolver: yupResolver(editCompanySchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      npwp: '',
      address: '',
      is_active: true,
    },
  });

  const getCompanyById = async () => {
    const res = await companyService.getCompanyById(companyId);

    if (!res.success) {
      throw new Error(res.message);
    }
    return res.data;
  };

  const { data: company, isLoading: isLoadingCompany } = useQuery({
    queryKey: ['company', companyId],
    queryFn: getCompanyById,
  });

  useEffect(() => {
    if (company) {
      reset({
        name: company.name,
        email: company.email || '',
        phone: company.phone || '',
        npwp: company.npwp || '',
        address: company.address || '',
        is_active: company.is_active,
      });
    }
  }, [company, reset]);

  const updateCompany = async (payload: EditCompanyPayload) => {
    const res = await companyService.updateCompany(companyId, payload);
    if (!res.success) {
      throw new Error(res.message);
    }
    return res;
  };

  const {
    mutate: mutateUpdateCompany,
    isPending: isPendingMutateUpdateCompany,
  } = useMutation({
    mutationFn: updateCompany,
    onSuccess: () => {
      setToaster({
        type: 'success',
        message: 'Success editi company',
      });
      router.push('/dashboard/companies');
    },
  });

  const handleUpdateCompany = (data: EditCompanyPayload) => {
    mutateUpdateCompany(data);
  };

  return {
    control,
    errors,
    handleSubmitForm,
    handleUpdateCompany,
    isPendingMutateUpdateCompany,
    isLoadingCompany,
    router,
  };
};

export default useEditCompanies;
