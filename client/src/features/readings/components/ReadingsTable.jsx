import React, { useState } from 'react';
import { ReadingRow } from './ReadingRow.jsx';
import { LoadingSpinner } from '../../../components/feedback/LoadingSpinner.jsx';
import { EmptyState } from '../../../components/feedback/EmptyState.jsx';
import { todayInTimezone } from '@sweety/shared/utils/date.js';

/**
 * Formats a readingDate string into friendly header text:
 * "Today", "Yesterday", or "Tuesday, 10 November 2026".
 */
function formatDateHeading(dateString) {
  if (!dateString) return 'Undated';
  const today = todayInTimezone();
  if (dateString === today) return 'Today';

  try {
    const [y, m, d] = dateString.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);

    // Check yesterday
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    if (
      dateObj.getFullYear() === yesterdayDate.getFullYear() &&
      dateObj.getMonth() === yesterdayDate.getMonth() &&
      dateObj.getDate() === yesterdayDate.getDate()
    ) {
      return 'Yesterday';
    }

    return dateObj.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function ReadingsTable({
  readings = [],
  isLoading = false,
  onEdit,
  onDelete,
  onAddClick,
}) {
  const [expandedId, setExpandedId] = useState(null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <LoadingSpinner size="md" />
        <p className="text-xs font-medium uppercase tracking-wider text-[#4D6B6D]">
          Loading clinical glucose log...
        </p>
      </div>
    );
  }

  if (!readings || readings.length === 0) {
    return (
      <EmptyState
        title="No glucose readings logged"
        description="Track your daily readings across the 4 circadian meal slots to monitor blood glucose control and view clinical trends."
        actionLabel={onAddClick ? 'Log First Reading' : undefined}
        onAction={onAddClick}
      />
    );
  }

  // Group readings by readingDate preserving chronological order
  const grouped = readings.reduce((acc, reading) => {
    const key = reading.readingDate || 'Unknown';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(reading);
    return acc;
  }, {});

  const handleToggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-[#EAE3DB]">
        <thead className="bg-[#F3EDE6]/40">
          <tr>
            <th
              scope="col"
              className="py-3 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-[#4D6B6D] sm:pl-6"
            >
              Clinical Slot
            </th>
            <th
              scope="col"
              className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#4D6B6D]"
            >
              Date
            </th>
            <th
              scope="col"
              className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#4D6B6D]"
            >
              Glucose Level
            </th>
            <th
              scope="col"
              className="relative py-3 pl-3 pr-4 sm:pr-6 text-right text-xs font-semibold uppercase tracking-wider text-[#4D6B6D]"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EAE3DB] bg-white">
          {Object.entries(grouped).map(([dateKey, groupReadings]) => (
            <React.Fragment key={dateKey}>
              {/* Date Section Subheader */}
              <tr className="bg-[#F3EDE6]/25">
                <td
                  colSpan={4}
                  className="py-2 pl-4 pr-3 sm:pl-6 text-xs font-bold uppercase tracking-wider text-[#195A5F] border-t border-b border-[#EAE3DB]/60"
                >
                  <div className="flex items-center justify-between">
                    <span>{formatDateHeading(dateKey)}</span>
                    <span className="text-[11px] font-normal text-[#4D6B6D] lowercase">
                      {groupReadings.length} {groupReadings.length === 1 ? 'reading' : 'readings'}
                    </span>
                  </div>
                </td>
              </tr>
              {groupReadings.map((reading) => (
                <ReadingRow
                  key={reading.id}
                  reading={reading}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isExpanded={expandedId === reading.id}
                  onToggleExpand={handleToggleExpand}
                />
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
