import React from 'react';
import { Button } from '../../../components/ui/Button.jsx';

export function Pagination({ page = 1, totalPages = 1, total = 0, onPageChange }) {
  if (totalPages <= 1 && total === 0) return null;

  return (
    <div className="flex items-center justify-between border-t border-[#EAE3DB] bg-white px-4 py-3 sm:px-6">
      <div className="hidden sm:block">
        <p className="text-xs text-[#4D6B6D]">
          Showing page <span className="font-semibold text-[#0F3336]">{page}</span> of{' '}
          <span className="font-semibold text-[#0F3336]">{Math.max(totalPages, 1)}</span> ({total} total readings)
        </p>
      </div>
      <div className="flex flex-1 justify-between sm:justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="text-xs h-8 px-3"
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="text-xs h-8 px-3"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
