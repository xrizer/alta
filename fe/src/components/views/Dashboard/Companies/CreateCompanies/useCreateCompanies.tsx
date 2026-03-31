'use client';

import { useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation } from '@tanstack/react-query';
import { ToasterContext } from '@/contexts/ToasterContext';
import * as companyService from '@/services/company-service';
import * as yup from 'yup';

export const createCompanySchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email'),
  phone: yup.string(),
  npwp: yup.string(),
  address: yup.string(),
});

export type CreateCompanyPayload = yup.InferType<typeof createCompanySchema>;

const useCreateCompanies = () => {
  const router = useRouter();
  const { setToaster } = useContext(ToasterContext);

  const {
    control,
    handleSubmit: handleSubmitForm,
    formState: { errors },
  } = useForm<CreateCompanyPayload>({
    resolver: yupResolver(createCompanySchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      npwp: '',
      address: '',
    },
  });

  const createCompany = async (payload: CreateCompanyPayload) => {
    const res = await companyService.createCompany(payload);

    if (!res.success) {
      throw new Error(res.message);
    }

    return res;
  };

  const {
    mutate: mutateCreateCompany,
    isPending: isPendingMutateCreateCompany,
    isSuccess: isSuccessMutateCreateCompany,
    error,
  } = useMutation({
    mutationFn: createCompany,
    onSuccess: () => {
      setToaster({
        type: 'success',
        message: 'Success create company',
      });

      router.push('/dashboard/companies');
    },
  });

  const handleCreateCompany = (data: CreateCompanyPayload) =>
    mutateCreateCompany(data);

  return {
    control,
    errors,
    handleSubmitForm,
    handleCreateCompany,
    isPendingMutateCreateCompany,
    isSuccessMutateCreateCompany,
    error,
    router,
  };
};

export default useCreateCompanies;
