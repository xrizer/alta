'use client';

import { Controller } from 'react-hook-form';
import useEditPositions from './useEditPositions';
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

const EditPositions = () => {
  const {
    companies,
    departments,
    control,
    errors,
    handleSubmitForm,
    handleUpdatePosition,
    isPendingMutateUpdatePosition,
    router,
  } = useEditPositions();

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Typography variant="h2">Edit Department</Typography>
        <Typography variant="bodyRegular">
          Update department information
        </Typography>
      </div>

      <form
        onSubmit={handleSubmitForm(handleUpdatePosition)}
        className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
        <div className="space-y-6 gap-x-6 grid md:grid-cols-2 ">
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
            name="department_id"
            control={control}
            render={({ field }) => (
              <div className="space-y-1">
                <Typography variant="bodyMedium">Department</Typography>

                <Select
                  value={field.value ?? ''}
                  onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectGroup>
                      {departments?.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                {errors.department_id && (
                  <p className="text-sm text-red-500">
                    {errors.department_id.message}
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
                placeholder="Staff Manager"
                label="Name"
                autoComplete="off"
                isInvalid={errors.name !== undefined}
                errorMessage={errors.name?.message}
              />
            )}
          />

          <Controller
            name="base_salary"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="number"
                placeholder="1000000"
                label="Base Salary"
                autoComplete="off"
                isInvalid={errors.base_salary !== undefined}
                errorMessage={errors.base_salary?.message}
              />
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

          <Button type="submit" disabled={isPendingMutateUpdatePosition}>
            {isPendingMutateUpdatePosition ? 'Updating...' : 'Update Position'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditPositions;
