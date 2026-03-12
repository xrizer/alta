import * as React from 'react';
import { cn } from '@/lib/utils';
import Typography from './typography';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  isInvalid?: boolean;
  variant?: 'bordered';
  icon?: React.ReactNode;
}

export function Input({
  label,
  helperText,
  errorMessage,
  isInvalid = false,
  icon,
  className,
  ...props
}: InputProps) {
  const isFileInput = props.type === 'file';
  const isPhoneInput = props.type === 'number';

  const generatedId = React.useId();
  const inputId = props.id || generatedId;

  return (
    <div className="flex flex-col gap-1">
      {label && <Typography variant="bodyMedium">{label}</Typography>}

      {isFileInput ? (
        <div className="flex items-center rounded-lg border border-border overflow-hidden w-full">
          <label
            htmlFor={inputId}
            className="px-4 py-2 text-disable cursor-pointer whitespace-nowrap">
            Pilih Foto
          </label>

          <span
            id={`${inputId}-filename`}
            className="px-4 py-2 text-disable truncate select-none">
            Tidak ada file yang dipilih
          </span>

          <input
            {...props}
            id={inputId}
            className="hidden"
            onChange={(e) => {
              const fileName =
                e.target.files?.[0]?.name || 'Tidak ada file yang dipilih';

              const fileLabelEl = document.getElementById(
                `${inputId}-filename`,
              );

              if (fileLabelEl) fileLabelEl.textContent = fileName;

              props.onChange?.(e);
            }}
          />
        </div>
      ) : (
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}

          <input
            {...props}
            id={inputId}
            type={props.type}
            inputMode={isPhoneInput ? 'numeric' : undefined}
            pattern={isPhoneInput ? '[0-9]*' : undefined}
            className={cn(
              'w-full rounded-lg px-5 py-2 text-base outline-none transition-all placeholder:text-disable focus:ring-0 border border-divider',
              icon && 'pl-12',
              className,
            )}
            aria-invalid={isInvalid}
            onChange={(e) => {
              if (isPhoneInput) {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
              }

              props.onChange?.(e);
            }}
          />
        </div>
      )}

      {isInvalid && errorMessage ? (
        <p className="text-sm text-error flex items-center gap-1">
          {errorMessage}
        </p>
      ) : helperText ? (
        <p className="text-sm text-muted">{helperText}</p>
      ) : null}
    </div>
  );
}
