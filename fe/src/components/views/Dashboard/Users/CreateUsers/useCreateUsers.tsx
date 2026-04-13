'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation } from '@tanstack/react-query';
import * as userService from '@/services/user-service';
import * as yup from 'yup';
import { Role } from '@/lib/types';
import { useContext } from 'react';
import { ToasterContext } from '@/contexts/ToasterContext';

export const createUserSchema = yup.object({
  name: yup
    .string()
    .required('Nama wajib diisi')
    .min(3, 'Nama minimal 3 karakter'),

  email: yup
    .string()
    .required('Email wajib diisi')
    .email('Format email tidak valid'),

  password: yup
    .string()
    .required('Password wajib diisi')
    .min(6, 'Password minimal 6 karakter'),

  role: yup
    .string()
    .required('Role wajib diisi')
    .oneOf(['admin', 'hr', 'employee'], 'Role tidak valid'),

  phone: yup
    .string()
    .required('Nomor HP wajib diisi')
    .matches(/^[0-9]+$/, 'Nomor HP hanya boleh angka')
    .min(10, 'Nomor HP minimal 10 digit'),

  address: yup
    .string()
    .required('Alamat wajib diisi')
    .min(5, 'Alamat terlalu pendek'),
});

export type CreateUsersPayload = yup.InferType<typeof createUserSchema>;

const useCreateUsers = () => {
  const router = useRouter();
  const { setToaster } = useContext(ToasterContext);

  const {
    control,
    handleSubmit: handleSubmitForm,
    formState: { errors },
  } = useForm<CreateUsersPayload>({
    resolver: yupResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'employee' as Role,
      phone: '',
      address: '',
    },
  });

  const createUsers = async (payload: CreateUsersPayload) => {
    const res = await userService.createUser({
      ...payload,
      role: payload.role as Role,
    });
    if (!res.success) {
      throw new Error(res.message);
    }

    return res;
  };

  const {
    mutate: mutateCreateUsers,
    isPending: isPendingMutateCreateUsers,
    isSuccess: isSuccessMutateCreateUsers,
    error,
  } = useMutation({
    mutationFn: createUsers,
    onSuccess: () => {
      setToaster({
        type: 'success',
        message: 'Success create user',
      });
      router.push('/dashboard/users');
    },
  });

  const handleCreateUsers = (data: CreateUsersPayload) =>
    mutateCreateUsers(data);

  return {
    control,
    errors,
    handleSubmitForm,
    handleCreateUsers,
    isPendingMutateCreateUsers,
    isSuccessMutateCreateUsers,
    error,
    router,
  };
};

export default useCreateUsers;
