import React from 'react';
import { EmptyState } from '../../../components/feedback/EmptyState.jsx';

export function ReportEmptyState({ type = 'daily', onLogClick }) {
  const typeLabel =
    type === 'daily'
      ? 'for this date'
      : type === 'month-to-date'
        ? 'for this month-to-date'
        : 'for the previous calendar month';

  return (
    <EmptyState
      title={`No clinical data ${typeLabel}`}
      description="Record your blood glucose measurements across the 4 daily slots to generate clinical trend analytics, Time-in-Range, and estimated A1C."
      actionLabel={onLogClick ? 'Log Glucose Reading' : undefined}
      onAction={onLogClick}
    />
  );
}
