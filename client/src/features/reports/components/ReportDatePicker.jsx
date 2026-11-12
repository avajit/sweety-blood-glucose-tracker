import React from 'react';
import { todayInTimezone } from '@sweety/shared/utils/date.js';
import { Button } from '../../../components/ui/Button.jsx';

const REPORT_TYPES = [
  { id: 'daily', label: 'Daily Log' },
  { id: 'month-to-date', label: 'Month-to-Date' },
  { id: 'monthly', label: 'Previous Month' },
];

export function ReportDatePicker({
  selectedType = 'daily',
  onTypeChange,
  selectedDate,
  onDateChange,
}) {
  const today = todayInTimezone();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Report Type Tabs */}
      <div className="flex rounded-lg bg-slate-100 p-1">
        {REPORT_TYPES.map((type) => {
          const isActive = selectedType === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onTypeChange(type.id)}
              className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {type.label}
            </button>
          );
        })}
      </div>

      {/* Reference Date Picker */}
      <div className="flex items-center space-x-2">
        <label htmlFor="report-reference-date" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
          Reference Date:
        </label>
        <input
          id="report-reference-date"
          type="date"
          max={today}
          value={selectedDate || today}
          onChange={(e) => onDateChange(e.target.value)}
          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {selectedDate !== today && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDateChange(today)}
            className="text-xs text-slate-500"
          >
            Today
          </Button>
        )}
      </div>
    </div>
  );
}
