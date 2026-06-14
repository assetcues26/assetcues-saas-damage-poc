import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex touch-manipulation items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-sm shadow-black/5 hover:bg-primary/90',
        destructive:
          'border-0 bg-red-600 text-white shadow-sm shadow-black/5 hover:bg-red-700 focus-visible:bg-red-700',
        outline:
          'border border-input bg-background shadow-sm shadow-black/5 hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm shadow-black/5 hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        /** @deprecated Use `default` — kept for existing pages */
        primary:
          'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20 hover:from-blue-600 hover:to-indigo-600',
        /** @deprecated Use `destructive` */
        danger:
          'border-0 bg-red-600 text-white shadow-sm shadow-black/5 hover:bg-red-700 focus-visible:bg-red-700',
        success:
          'bg-emerald-600 text-white shadow-sm shadow-black/5 hover:bg-emerald-700',
      },
      size: {
        default: 'min-h-11 h-11 px-4 py-2 text-base sm:text-sm sm:min-h-9 sm:h-9',
        sm: 'min-h-10 h-10 rounded-lg px-3 text-sm sm:min-h-8 sm:h-8 sm:text-xs',
        lg: 'min-h-12 h-12 rounded-lg px-8 text-base sm:min-h-10 sm:h-10',
        icon: 'h-11 w-11 min-h-11 min-w-11 sm:h-9 sm:w-9 sm:min-h-9 sm:min-w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export const Button = React.forwardRef(function Button(
  {
    className,
    variant,
    size,
    asChild = false,
    type = 'button',
    ariaLabel,
    ...props
  },
  ref,
) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      type={asChild ? undefined : type}
      aria-label={ariaLabel ?? props['aria-label']}
      {...props}
    />
  );
});

Button.displayName = 'Button';
