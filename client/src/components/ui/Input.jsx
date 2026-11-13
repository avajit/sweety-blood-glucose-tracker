import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils.js';

export const Input = forwardRef(({ className, type = 'text', error, ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      aria-invalid={Boolean(error)}
      className={cn(
        'flex h-11 w-full rounded-xl border border-[#EAE3DB] bg-white px-3.5 py-2 text-sm text-[#0F3336] placeholder:text-muted-foreground/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#128B80] focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50',
        error && 'border-[#991B1B] focus-visible:ring-[#991B1B]',
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = 'Input';
