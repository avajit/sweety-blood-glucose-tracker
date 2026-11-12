import React from 'react';
import { cn } from '../../lib/utils.js';

const variantClasses = {
  default: 'border-transparent bg-primary text-primary-foreground',
  secondary: 'border-transparent bg-secondary text-secondary-foreground',
  destructive: 'border-transparent bg-destructive text-destructive-foreground',
  outline: 'text-foreground border-border',
  // Clinical variants
  target: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  low: 'border-amber-200 bg-amber-50 text-amber-700',
  critical: 'border-rose-200 bg-rose-50 text-rose-700 font-semibold',
  high: 'border-orange-200 bg-orange-50 text-orange-700',
  severe: 'border-purple-200 bg-purple-50 text-purple-700 font-semibold',
};

export function Badge({ className, variant = 'default', children, ...props }) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none',
        variantClasses[variant] || variantClasses.default,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

