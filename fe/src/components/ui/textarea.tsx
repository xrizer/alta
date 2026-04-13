import * as React from 'react';
import { cn } from '@/lib/utils';
import Typography from './typography';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  isInvalid?: boolean;
}

export function Textarea({
  label,
  helperText,
  errorMessage,
  isInvalid = false,
  className,
  ...props
}: TextareaProps) {
  const status = isInvalid ? 'error' : 'default';

  const baseStyle =
    'w-full rounded-lg px-4 py-2 text-base outline-none transition-all placeholder:text-disable ';

  const stateStyle: Record<string, string> = {
    default: 'border border-divider text-foreground',
    error: 'border-2 border-error bg-error-surface text-foreground',
  };

  const helperTextStyle: Record<string, string> = {
    default: 'text-muted',
    error: 'text-error',
  };

  return (
    <div className="flex flex-col gap-1">
      {label && <Typography variant="bodyMedium">{label}</Typography>}

      <textarea
        className={cn(baseStyle, stateStyle[status], className)}
        aria-invalid={isInvalid}
        {...props}
      />

      {isInvalid && errorMessage ? (
        <p
          className={cn(
            'text-sm flex items-center gap-1',
            helperTextStyle.error,
          )}>
          {errorMessage}
        </p>
      ) : helperText ? (
        <p className={cn('text-sm', helperTextStyle.default)}>{helperText}</p>
      ) : null}
    </div>
  );
}
