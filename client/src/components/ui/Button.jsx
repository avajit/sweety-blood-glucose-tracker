import React from 'react';
import { cn } from '../../lib/utils.js';

const variantClasses = {
  primary:
    'bg-[#195A5F] text-white hover:bg-[#14484B] focus-visible:ring-[#195A5F]',
  secondary:
    'bg-[#128B80] text-white hover:bg-[#0E6F67] focus-visible:ring-[#128B80]',
  destructive:
    'bg-[#991B1B] text-white hover:bg-[#7F1D1D] focus-visible:ring-[#991B1B]',
  outline:
    'border border-[#EAE3DB] bg-white text-[#0F3336] hover:bg-[#F3EDE6]/60 focus-visible:ring-[#195A5F]',
  ghost:
    'text-[#0F3336] hover:bg-[#EAE3DB]/40 focus-visible:ring-[#195A5F]',
  link:
    'text-[#195A5F] underline-offset-4 hover:underline p-0 h-auto font-medium',
};

const sizeClasses = {
  sm: 'h-8 px-3.5 text-xs rounded-full',
  md: 'h-10 px-5 py-2 text-sm rounded-full',
  lg: 'h-11 px-7 text-base rounded-full',
  icon: 'h-9 w-9 p-2 rounded-full',
};

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  isLoading = false,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 select-none cursor-pointer',
        variantClasses[variant] || variantClasses.primary,
        sizeClasses[size] || sizeClasses.md,
        className,
      )}
      {...props}
    >
      {isLoading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
