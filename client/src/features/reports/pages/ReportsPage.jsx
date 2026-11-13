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
import { DownloadIcon } from '../../../components/icons/index.jsx';

export default function ReportsPage() {
  const today = todayInTimezone();
  const [reportType, setReportType] = useState('daily');
  const [referenceDate, setReferenceDate] = useState(today);

  const { data: report, isLoading, isError, error } = useReport(reportType, {
    date: referenceDate,
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Clinical Masthead */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-2 border-b border-[#EAE3DB]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#128B80]">
            Clinical Analytics
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0F3336] tracking-tight mt-0.5">
            Clinical Analytics & Reports
          </h1>
          <p className="mt-1 text-sm text-[#4D6B6D]">
            Review your glucose trends, Time-in-Range (TIR), and estimated A1C against ADA clinical targets.
          </p>
        </div>

        {/* Action Button: Export Report CSV */}
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
            className="space-x-1.5"
          >
            <DownloadIcon className="h-4 w-4 text-[#128B80]" />
            <span>Export Report CSV</span>
          </Button>
        </div>
      </div>

      {/* 2. Date & Timeframe Selector */}
      <ReportDatePicker
        selectedType={reportType}
        onTypeChange={(type) => setReportType(type)}
        selectedDate={referenceDate}
        onDateChange={(date) => setReferenceDate(date)}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <LoadingSpinner size="lg" />
          <p className="text-xs font-medium uppercase tracking-wider text-[#4D6B6D]">
            Generating clinical analytics...
          </p>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div
          role="alert"
          className="rounded-xl border border-[#991B1B]/30 bg-[#FEE2E2]/60 p-4 text-xs font-medium text-[#991B1B]"
        >
          Failed to load clinical report: {error?.message || 'Server error'}
        </div>
      )}

      {/* 3. Analytics Content */}
      {!isLoading && !isError && report && (
        <div className="space-y-6 sm:space-y-8">
          {/* Active Range & Cohort Info Banner */}
          {report.range && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl bg-[#F3EDE6]/60 border border-[#EAE3DB] px-4 py-3 text-xs text-[#4D6B6D]">
              <div>
                <span className="font-semibold text-[#0F3336]">Report Window:</span>{' '}
                <span className="font-mono font-medium">{report.range.from}</span> to{' '}
                <span className="font-mono font-medium">{report.range.to}</span>
              </div>
              <div className="font-semibold text-[#195A5F] uppercase tracking-wider text-[11px]">
                {report.count} {report.count === 1 ? 'reading' : 'readings'} evaluated
              </div>
            </div>
          )}

          {/* Summary KPI Cards & TIR Bar */}
          <ReportStats report={report} />

          {/* Recharts Visualization */}
          <MonthlyChart readings={report.readings || []} />

          {/* Detailed Readings List */}
          <DailyReadingsList readings={report.readings || []} />
        </div>
      )}
    </div>
  );
}
