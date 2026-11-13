import React from 'react';
import { cn } from '../../lib/utils.js';

const variantClasses = {
  default:
    'border-transparent bg-[#195A5F] text-white',
  secondary:
    'border-transparent bg-[#EAE3DB] text-[#0F3336]',
  destructive:
    'border-transparent bg-[#991B1B] text-white',
  outline:
    'border-[#EAE3DB] text-[#0F3336] bg-transparent',
  // Clinical status variants (Strict accessible contrast)
  target:
    'border-[#A3E6B4] bg-[#EBF7EE] text-[#1B6B2E]',
  low:
    'border-[#FDE68A] bg-[#FEF3C7] text-[#92400E]',
  critical:
    'border-[#FECACA] bg-[#FEE2E2] text-[#991B1B] font-semibold',
  high:
    'border-[#FED7AA] bg-[#FFEDD5] text-[#9A3412]',
  severe:
    'border-[#FED7AA] bg-[#FFEDD5] text-[#7C2D12] font-semibold',
  // Compatibility mappings for existing tests
  success:
    'border-[#A3E6B4] bg-[#EBF7EE] text-[#1B6B2E]',
  warning:
    'border-[#FDE68A] bg-[#FEF3C7] text-[#92400E]',
  danger:
    'border-[#FECACA] bg-[#FEE2E2] text-[#991B1B] font-semibold',
};

export function Badge({ className, variant = 'default', children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-tight select-none transition-colors',
        variantClasses[variant] || variantClasses.default,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
