import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { todayInTimezone } from '@sweety/shared/utils/date.js';
import { useReport } from '../../reports/hooks/useReport.js';
import { ReportDatePicker } from '../../reports/components/ReportDatePicker.jsx';
import { ReportStats } from '../../reports/components/ReportStats.jsx';
import { MonthlyChart } from '../../reports/components/MonthlyChart.jsx';
import { DailyReadingsList } from '../../reports/components/DailyReadingsList.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { LoadingSpinner } from '../../../components/feedback/LoadingSpinner.jsx';
import { downloadReadingsCsv } from '../../../utils/csvExport.js';
import { DownloadIcon, ArrowLeftIcon } from '../../../components/icons/index.jsx';

export default function PatientReportPage() {
  const { patientId } = useParams();
  const today = todayInTimezone();
  const [reportType, setReportType] = useState('daily');
  const [referenceDate, setReferenceDate] = useState(today);

  const { data: report, isLoading, isError, error } = useReport(reportType, {
    date: referenceDate,
    patientId,
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-2 border-b border-[#EAE3DB]">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <Link to="/doctor/patients">
              <Button variant="ghost" size="sm" className="px-2 text-xs space-x-1 text-[#195A5F]">
                <ArrowLeftIcon className="h-3.5 w-3.5" />
                <span>Back to Patients</span>
              </Button>
            </Link>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#128B80]">
            Patient Clinical Analytics
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0F3336] tracking-tight mt-0.5">
            Patient Analytics & Reports
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#4D6B6D]">
            Reviewing assigned record cohort for Patient ID:{' '}
            <span className="font-mono text-xs bg-[#F3EDE6] px-1.5 py-0.5 rounded text-[#0F3336] font-semibold">
              {patientId}
            </span>
          </p>
        </div>

        {/* Action Button: Export Patient CSV */}
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadReadingsCsv(
                report?.readings || [],
                `sweety-patient-${patientId}-${reportType}-${referenceDate}.csv`
              )
            }
            disabled={!report?.readings || report.readings.length === 0}
            className="space-x-1.5"
          >
            <DownloadIcon className="h-4 w-4 text-[#128B80]" />
            <span>Export Patient CSV</span>
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
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <LoadingSpinner size="lg" />
          <p className="text-xs font-medium uppercase tracking-wider text-[#4D6B6D]">
            Retrieving patient clinical data...
          </p>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div
          role="alert"
          className="rounded-xl border border-[#991B1B]/30 bg-[#FEE2E2]/60 p-4 text-xs font-medium text-[#991B1B]"
        >
          Failed to load patient report: {error?.message || 'Unauthorized or unlinked patient'}
        </div>
      )}

      {/* Content */}
      {!isLoading && !isError && report && (
        <div className="space-y-6 sm:space-y-8">
          {/* Active Range & Cohort Info */}
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
