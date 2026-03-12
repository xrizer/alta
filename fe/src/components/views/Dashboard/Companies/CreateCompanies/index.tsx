'use client';

import { Controller } from 'react-hook-form';
import useCreateCompany from './useCreateCompanies';

import { Button } from '@/components/ui/button';
import Typography from '@/components/ui/typography';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const CreateCompanies = () => {
  const {
    control,
    errors,
    handleSubmitForm,
    handleCreateCompany,
    isPendingMutateCreateCompany,
    router,
  } = useCreateCompany();

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Typography variant="h2">Create Company</Typography>
        <Typography variant="bodyRegular">Add New Company</Typography>
      </div>

      <form
        onSubmit={handleSubmitForm(handleCreateCompany)}
        className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="text"
                placeholder="PT Alta Indonesia"
                label="Name"
                autoComplete="off"
                isInvalid={errors.name !== undefined}
                errorMessage={errors.name?.message}
              />
            )}
          />

          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="text"
                label="Email"
                placeholder="info@alta.co.id"
                autoComplete="off"
                isInvalid={errors.email !== undefined}
                errorMessage={errors.email?.message}
              />
            )}
          />

          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="number"
                label="Phone"
                placeholder="08xxxxx"
                autoComplete="off"
                isInvalid={errors.phone !== undefined}
                errorMessage={errors.phone?.message}
              />
            )}
          />

          <Controller
            name="npwp"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="number"
                label="NPWP"
                placeholder="150-123xxxx"
                autoComplete="off"
                isInvalid={errors.npwp !== undefined}
                errorMessage={errors.npwp?.message}
              />
            )}
          />
        </div>

        <Controller
          name="address"
          control={control}
          render={({ field }) => (
            <Textarea
              {...field}
              placeholder="PT Alta Indonesia"
              label="Adress"
              autoComplete="off"
              isInvalid={errors.address !== undefined}
              errorMessage={errors.address?.message}
            />
          )}
        />
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="primary-outline"
            className="px-5"
            onClick={() => router.back()}>
            Cancel
          </Button>

          <Button type="submit" disabled={isPendingMutateCreateCompany}>
            {isPendingMutateCreateCompany ? 'Creating...' : 'Create Company'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateCompanies;
