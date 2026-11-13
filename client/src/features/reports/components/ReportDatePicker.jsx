import React from 'react';
import { todayInTimezone } from '@sweety/shared/utils/date.js';
import { Button } from '../../../components/ui/Button.jsx';
import { CalendarIcon } from '../../../components/icons/index.jsx';

const REPORT_TYPES = [
  { id: 'daily', label: 'Daily Log' },
  { id: 'month-to-date', label: 'Month-to-Date' },
  { id: 'monthly', label: 'Full Monthly' },
];

export function ReportDatePicker({
  selectedType = 'daily',
  onTypeChange,
  selectedDate,
  onDateChange,
}) {
  const today = todayInTimezone();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-[#EAE3DB] bg-white p-4 shadow-subtle">
      {/* Report Timeframe Segmented Pill Bar */}
      <div className="inline-flex rounded-full bg-[#F3EDE6] p-1 border border-[#EAE3DB]/80">
        {REPORT_TYPES.map((type) => {
          const isActive = selectedType === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onTypeChange(type.id)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#195A5F] text-white shadow-subtle'
                  : 'text-[#4D6B6D] hover:text-[#0F3336]'
              }`}
            >
              {type.label}
            </button>
          );
        })}
      </div>

      {/* Reference Date Picker with Stepper helper */}
      <div className="flex items-center space-x-2.5">
        <label
          htmlFor="report-reference-date"
          className="flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-[#4D6B6D] whitespace-nowrap"
        >
          <CalendarIcon className="h-4 w-4 text-[#128B80]" />
          <span>Reference Date:</span>
        </label>
        <input
          id="report-reference-date"
          type="date"
          max={today}
          value={selectedDate || today}
          onChange={(e) => onDateChange(e.target.value)}
          className="flex h-9 rounded-xl border border-[#EAE3DB] bg-white px-3 py-1 text-xs sm:text-sm text-[#0F3336] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#128B80] transition-colors"
        />
        {selectedDate !== today && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDateChange(today)}
            className="text-xs h-9 px-3 text-[#195A5F]"
          >
            Today
          </Button>
        )}
      </div>
    </div>
  );
}
