import React, { useState } from 'react';
import { todayInTimezone } from '@sweety/shared/utils/date.js';
import { useReport } from '../hooks/useReport.js';
import { ReportDatePicker } from '../components/ReportDatePicker.jsx';
import { ReportStats } from '../components/ReportStats.jsx';
import { MonthlyChart } from '../components/MonthlyChart.jsx';
import { DailyReadingsList } from '../components/DailyReadingsList.jsx';
import { LoadingSpinner } from '../../../components/feedback/LoadingSpinner.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { downloadReadingsCsv } from '../../../utils/csvExport.js';

export default function ReportsPage() {
  const today = todayInTimezone();
  const [reportType, setReportType] = useState('daily');
  const [referenceDate, setReferenceDate] = useState(today);

  const { data: report, isLoading, isError, error } = useReport(reportType, {
    date: referenceDate,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Clinical Analytics & Reports
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review your glucose trends, Time-in-Range (TIR), and estimated A1C against ADA clinical targets.
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadReadingsCsv(
                report?.readings || [],
                `sweety-report-${reportType}-${referenceDate}.csv`
              )
            }
            disabled={!report?.readings || report.readings.length === 0}
            className="shadow-sm"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export Report CSV
          </Button>
        </div>
      </div>

      {/* Date & Type Selector */}
      <ReportDatePicker
        selectedType={reportType}
        onTypeChange={(type) => setReportType(type)}
        selectedDate={referenceDate}
        onDateChange={(date) => setReferenceDate(date)}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          Failed to load clinical report: {error?.message || 'Server error'}
        </div>
      )}

      {/* Content */}
      {!isLoading && !isError && report && (
        <div className="space-y-6">
          {/* Active Range & Cohort Info */}
          {report.range && (
            <div className="flex items-center justify-between rounded-lg bg-slate-100/80 px-4 py-2.5 text-xs text-slate-700">
              <div>
                <span className="font-semibold text-slate-900">Report Window:</span>{' '}
                <span className="font-mono">{report.range.from}</span> to{' '}
                <span className="font-mono">{report.range.to}</span>
              </div>
              <div className="font-medium text-slate-500">
                {report.count} {report.count === 1 ? 'reading' : 'readings'} logged
              </div>
            </div>
          )}

          {/* Summary KPI Cards & TIR Bar */}
          <ReportStats report={report} />

          {/* Recharts Visualisation */}
          <MonthlyChart readings={report.readings || []} />

          {/* Detailed Readings List */}
          <DailyReadingsList readings={report.readings || []} />
        </div>
      )}
    </div>
  );
}
