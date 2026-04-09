'use client';

import { Controller } from 'react-hook-form';
import useCreateShifts from './useCreateShifts';
import { Button } from '@/components/ui/button';
import Typography from '@/components/ui/typography';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CreateShifts = () => {
  const {
    companies,
    control,
    errors,
    handleSubmitForm,
    handleCreateShifts,
    isPendingMutateCreateShifts,
    router,
  } = useCreateShifts();

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Typography variant="h2">Create Positions</Typography>
        <Typography variant="bodyRegular">Add New Positions</Typography>
      </div>

      <form
        onSubmit={handleSubmitForm(handleCreateShifts)}
        className="space-y-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="space-y-6 ">
          <Controller
            name="company_id"
            control={control}
            render={({ field }) => (
              <div className="space-y-1">
                <Typography variant="bodyMedium">Company</Typography>

                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Company" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectGroup>
                      {companies?.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                {errors.company_id && (
                  <p className="text-sm text-red-500">
                    {errors.company_id.message}
                  </p>
                )}
              </div>
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
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="primary-outline"
            className="px-5"
            onClick={() => router.back()}>
            Cancel
          </Button>

          <Button type="submit" disabled={isPendingMutateCreateShifts}>
            {isPendingMutateCreateShifts ? 'Creating...' : 'Create Position'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateShifts;
