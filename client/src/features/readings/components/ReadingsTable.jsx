import React from 'react';
import { ReadingRow } from './ReadingRow.jsx';
import { LoadingSpinner } from '../../../components/feedback/LoadingSpinner.jsx';
import { EmptyState } from '../../../components/feedback/EmptyState.jsx';

export function ReadingsTable({ readings = [], isLoading = false, onEdit, onDelete, onAddClick }) {
  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (!readings || readings.length === 0) {
    return (
      <EmptyState
        title="No glucose readings logged"
        description="Track your daily readings to monitor blood glucose control and view clinical trends."
        actionLabel={onAddClick ? 'Log First Reading' : undefined}
        onAction={onAddClick}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-slate-600 sm:pl-6">
              Clinical Slot
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-slate-600">
              Date
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-slate-600">
              Glucose Level
            </th>
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right text-xs font-semibold text-slate-600">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {readings.map((reading) => (
            <ReadingRow
              key={reading.id}
              reading={reading}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
