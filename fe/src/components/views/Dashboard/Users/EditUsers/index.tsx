'use client';

import { Controller } from 'react-hook-form';
import useEditUsers from './useEditUsers';
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
import { Textarea } from '@/components/ui/textarea';

const roleOptions = [
  { value: 'superadmin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'hr', label: 'HR' },
  { value: 'employee', label: 'Employee' },
];

const EditUsers = () => {
  const {
    control,
    errors,
    handleSubmitForm,
    handleUpdateUser,
    isPendingMutateUpdateUser,
    router,
  } = useEditUsers();

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Typography variant="h2">Edit User</Typography>
        <Typography variant="bodyRegular">Update user information</Typography>
      </div>

      <form
        onSubmit={handleSubmitForm(handleUpdateUser)}
        className="space-y-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="space-y-6">
          <Typography variant="h3" className="font-semibold!">
            User Information
          </Typography>
          <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="text"
                  label="Name"
                  placeholder="Input your name"
                  autoComplete="off"
                  isInvalid={errors.name !== undefined}
                  errorMessage={errors.name?.message}
                />
              )}
            />

            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <div className="space-y-1">
                  <Typography variant="bodyMedium">Role</Typography>

                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectGroup>
                        {roleOptions.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  {errors.role && (
                    <p className="text-sm text-red-500">
                      {errors.role.message}
                    </p>
                  )}
                </div>
              )}
            />
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="text"
                  label="Phone"
                  placeholder="08xxxxxxxx"
                  autoComplete="off"
                  isInvalid={errors.phone !== undefined}
                  errorMessage={errors.phone?.message}
                />
              )}
            />
            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder="Lorem ipsum dolor sit amet..."
                  label="Address"
                  autoComplete="off"
                  isInvalid={errors.address !== undefined}
                  errorMessage={errors.address?.message}
                />
              )}
            />
          </div>

          <Typography variant="h3" className="font-semibold!">
            Login Credentials
          </Typography>
          <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="text"
                  label="Email"
                  placeholder="mail@example.com"
                  autoComplete="off"
                  isInvalid={errors.email !== undefined}
                  errorMessage={errors.email?.message}
                />
              )}
            />
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="password"
                  label="Password"
                  placeholder="*********"
                  autoComplete="off"
                  isInvalid={errors.password !== undefined}
                  errorMessage={errors.password?.message}
                />
              )}
            />
          </div>
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

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="primary-outline"
            className="px-5"
            onClick={() => router.back()}>
            Cancel
          </Button>

          <Button type="submit" disabled={isPendingMutateUpdateUser}>
            {isPendingMutateUpdateUser ? 'Updating...' : 'Update Position'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditUsers;
