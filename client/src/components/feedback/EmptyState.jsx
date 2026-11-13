import React from 'react';
import { cn } from '../../lib/utils.js';
import { Button } from '../ui/Button.jsx';
import { DropletIcon } from '../icons/index.jsx';

export function EmptyState({
  icon,
  title = 'No data available',
  description = 'There are no records to display for this period.',
  action,
  actionLabel,
  onAction,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#EAE3DB] bg-[#F3EDE6]/25 p-10 text-center',
        className,
      )}
    >
      <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-full bg-[#195A5F]/10 text-[#195A5F]">
        {icon || <DropletIcon className="h-6 w-6" />}
      </div>
      <h3 className="text-base font-serif font-bold text-[#0F3336]">{title}</h3>
      <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-[#4D6B6D] leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
      {!action && actionLabel && onAction && (
        <div className="mt-5">
          <Button size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
