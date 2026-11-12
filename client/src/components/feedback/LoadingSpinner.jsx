import React from 'react';
import { cn } from '../../lib/utils.js';

export function LoadingSpinner({ className, size = 'md', label = 'Loading...' }) {
  const sizeClass = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  }[size] || 'h-8 w-8 border-3';

  return (
    <div className={cn('flex flex-col items-center justify-center p-6 text-slate-500', className)} role="status">
      <div
        className={cn(
          'animate-spin rounded-full border-solid border-primary border-t-transparent',
          sizeClass,
        )}
      />
      {label && <span className="mt-3 text-xs font-medium text-muted-foreground">{label}</span>}
    </div>
  );
}
