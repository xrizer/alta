'use client';

import { Controller } from 'react-hook-form';
import useCreateDepartment from './useCreateDepartments';
import { Button } from '@/components/ui/button';
import Typography from '@/components/ui/typography';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CreateDepartments = () => {
  const {
    companies,
    control,
    errors,
    handleSubmitForm,
    handleCreateDepartments,
    isPendingMutateCreateDepartments,
    router,
  } = useCreateDepartment();

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Typography variant="h2">Create Department</Typography>
        <Typography variant="bodyRegular">Add New Department</Typography>
      </div>

      <form
        onSubmit={handleSubmitForm(handleCreateDepartments)}
        className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
        <div className="space-y-6">
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
                label="Description"
                autoComplete="off"
                isInvalid={errors.description !== undefined}
                errorMessage={errors.description?.message}
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

          <Button type="submit" disabled={isPendingMutateCreateDepartments}>
            {isPendingMutateCreateDepartments
              ? 'Creating...'
              : 'Create Department'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateDepartments;
