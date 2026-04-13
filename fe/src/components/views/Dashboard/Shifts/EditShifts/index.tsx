'use client';

import { Controller } from 'react-hook-form';
import useEditShifts from './useEditShifts';
import { Button } from '@/components/ui/button';
import Typography from '@/components/ui/typography';
import { Input } from '@/components/ui/input';

const EditShifts = () => {
  const {
    companies,
    control,
    errors,
    handleSubmitForm,
    handleUpdateShift,
    isPendingMutateUpdateShift,
    router,
  } = useEditShifts();

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Typography variant="h2">Edit Shift</Typography>
        <Typography variant="bodyRegular">Update shift information</Typography>
      </div>

      <form
        onSubmit={handleSubmitForm(handleUpdateShift)}
        className="space-y-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="space-y-6  ">
          <Controller
            name="company_id"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="text"
                disabled
                value={companies.find((c) => c.id === field.value)?.name || ''}
                placeholder="Staff Manager"
                label="Company"
                autoComplete="off"
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
                placeholder="Regular"
                label="Name"
                autoComplete="off"
                isInvalid={errors.name !== undefined}
                errorMessage={errors.name?.message}
              />
            )}
          />

          <div className="grid md:grid-cols-2 gap-x-6">
            <Controller
              name="start_time"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="time"
                  label="Start Time"
                  autoComplete="off"
                  isInvalid={errors.start_time !== undefined}
                  errorMessage={errors.start_time?.message}
                />
              )}
            />
            <Controller
              name="end_time"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="time"
                  label="End Time"
                  autoComplete="off"
                  isInvalid={errors.end_time !== undefined}
                  errorMessage={errors.end_time?.message}
                />
              )}
            />
          </div>

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

          <Button type="submit" disabled={isPendingMutateUpdateShift}>
            {isPendingMutateUpdateShift ? 'Updating...' : 'Update Position'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditShifts;
