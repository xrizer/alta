'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as yup from 'yup';
import * as userService from '@/services/user-service';
import { Role } from '@/lib/types';
import { useContext } from 'react';
import { ToasterContext } from '@/contexts/ToasterContext';

export const editUserSchema = yup.object({
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
  is_active: yup.boolean(),
});

export type EditPositionPayload = yup.InferType<typeof editUserSchema>;

const useEditUsers = () => {
  const router = useRouter();
  const params = useParams();
  const { setToaster } = useContext(ToasterContext);
  const userId = params.id as string;

  const {
    control,
    handleSubmit: handleSubmitForm,
    formState: { errors },
    reset,
  } = useForm<EditPositionPayload>({
    resolver: yupResolver(editUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'employee' as Role,
      phone: '',
      address: '',
      is_active: false,
    },
  });

  const getUserById = async () => {
    const res = await userService.getUserById(userId);

    if (!res.success) {
      throw new Error(res.message);
    }
    return res.data;
  };

  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: getUserById,
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        role: user.role || '',
        password: user.password || '',
        is_active: user.is_active,
      });
    }
  }, [user, reset]);

  const updateUser = async (payload: EditPositionPayload) => {
    const res = await userService.updateUser(userId, {
      ...payload,
      role: payload.role as Role,
    });
    if (!res.success) {
      throw new Error(res.message);
    }
    return res;
  };

  const { mutate: mutateUpdateUser, isPending: isPendingMutateUpdateUser } =
    useMutation({
      mutationFn: updateUser,

      onSuccess: () => {
        setToaster({
          type: 'success',
          message: 'Success edit user',
        });
        router.push('/dashboard/users');
      },
    });

  const handleUpdateUser = (data: EditPositionPayload) => {
    mutateUpdateUser(data);
  };

  return {
    control,
    errors,
    handleSubmitForm,
    handleUpdateUser,
    isPendingMutateUpdateUser,
    router,
  };
};

export default useEditUsers;
