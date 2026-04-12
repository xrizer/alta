'use client';

import { Controller } from 'react-hook-form';
import useEditDepartments from './useEditDepartments';
import { Button } from '@/components/ui/button';
import Typography from '@/components/ui/typography';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const EditDepartments = () => {
  const {
    companies,
    control,
    errors,
    handleSubmitForm,
    handleUpdateDepartment,
    isPendingMutateUpdateDepartment,
    router,
  } = useEditDepartments();

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Typography variant="h2">Edit Department</Typography>
        <Typography variant="bodyRegular">
          Update department information
        </Typography>
      </div>

      <form
        onSubmit={handleSubmitForm(handleUpdateDepartment)}
        className="space-y-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="space-y-6">
          <Controller
            name="company_id"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="text"
                placeholder="PT Alta Indonesia"
                label="Company"
                value={companies.find((c) => c.id === field.value)?.name || ''}
                autoComplete="off"
                disabled
                isInvalid={errors.company_id !== undefined}
                errorMessage={errors.company_id?.message}
              />
            )}
          />
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
            name="description"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                placeholder="PT Alta Indonesia"
                label="Adress"
                autoComplete="off"
                isInvalid={errors.description !== undefined}
                errorMessage={errors.description?.message}
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
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="primary-outline"
            className="px-5"
            onClick={() => router.back()}>
            Cancel
          </Button>

          <Button type="submit" disabled={isPendingMutateUpdateDepartment}>
            {isPendingMutateUpdateDepartment
              ? 'Updating...'
              : 'Update Department'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditDepartments;
