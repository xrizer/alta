import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'cursor-pointer inline-flex items-center justify-center gap-1 rounded-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-60 select-none outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
  {
    variants: {
      variant: {
        //  PRIMARY
        primary: 'bg-primary text-white hover:bg-primary/90',
        'primary-outline':
          'border-2 border-primary text-primary bg-transparent hover:bg-primary/10',

        // WARNING
        warning: 'bg-secondary text-white hover:bg-secondary/90',
        'warning-outline':
          'border-2 border-disable text-primary-text bg-transparent hover:bg-disable/10',

        // GRAY
        gray: 'bg-disable text-disable-foreground ',
        'gray-outline':
          'border-2 border-disable text-disable bg-input hover:bg-disable/10',

        destructive: 'bg-destructive text-white ',

        // ⚪ DISABLED (manual control)
        muted: 'bg-muted text-muted-foreground cursor-not-allowed',

        // INFO - BLUE
        info: 'bg-info text-white hover:bg-info/90',

        default: 'bg-primary text-white',
        icon: 'bg-transparent',
      },

      size: {
        default: 'h-9 px-4 text-sm',
        sm: 'h-9 px-4 text-sm',
        lg: 'h-12 px-8 text-lg',
        icon: 'md:h-11 md:w-11 text-sm',
        sizeless: 'h-0 w-0',
      },
    },

    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
