'use client';

import { Controller } from 'react-hook-form';
import useEditCompanies from './useEditCompanies';

import { Button } from '@/components/ui/button';
import Typography from '@/components/ui/typography';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const EditCompanies = () => {
  const {
    control,
    errors,
    handleSubmitForm,
    handleUpdateCompany,
    isPendingMutateUpdateCompany,
    isLoadingCompany,
    router,
  } = useEditCompanies();

  if (isLoadingCompany) {
    return (
      <div className="flex justify-center py-10">
        <Typography variant="bodyRegular">Loading...</Typography>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Typography variant="h2">Edit Company</Typography>
        <Typography variant="bodyRegular">
          Update company information
        </Typography>
      </div>

      <form
        onSubmit={handleSubmitForm(handleUpdateCompany)}
        className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Name"
                placeholder="PT Alta Indonesia"
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
                label="Email"
                placeholder="info@alta.co.id"
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
                label="Phone"
                placeholder="08xxxxx"
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
                label="NPWP"
                placeholder="150-123xxxx"
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
              label="Address"
              placeholder="Company address"
              isInvalid={errors.address !== undefined}
              errorMessage={errors.address?.message}
            />
          )}
        />

        {/* checkbox */}
        <Controller
          name="is_active"
          control={control}
          render={({ field }) => (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 accent-primary "
              />
              <label className="text-sm font-medium text-gray-700">
                Active
              </label>
            </div>
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

          <Button type="submit" disabled={isPendingMutateUpdateCompany}>
            {isPendingMutateUpdateCompany ? 'Updating...' : 'Update Company'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditCompanies;
