import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SLOT_VALUES } from '@sweety/shared/constants/slots.js';
import { useReadings } from '../hooks/useReadings.js';
import { ReadingsTable } from '../components/ReadingsTable.jsx';
import { ReadingForm } from '../components/ReadingForm.jsx';
import { DeleteReadingDialog } from '../components/DeleteReadingDialog.jsx';
import { HypoglycemiaAlertModal } from '../components/HypoglycemiaAlertModal.jsx';
import { Pagination } from '../components/Pagination.jsx';
import { formatSlot } from '../../../lib/format.js';
import { Button } from '../../../components/ui/Button.jsx';
import { Card, CardContent } from '../../../components/ui/Card.jsx';
import { downloadReadingsCsv } from '../../../utils/csvExport.js';
import { DownloadIcon, PlusIcon } from '../../../components/icons/index.jsx';

export default function ReadingsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState(null);
  const [deletingReading, setDeletingReading] = useState(null);
  const [hypoAlertValue, setHypoAlertValue] = useState(null);

  const queryParams = {
    page,
    limit: 10,
    ...(selectedSlot ? { slot: selectedSlot } : {}),
    ...(fromDate ? { from: fromDate } : {}),
    ...(toDate ? { to: toDate } : {}),
  };

  const { data, isLoading, isError, error, refetch } = useReadings(queryParams);

  const readings = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const hasActiveFilters = Boolean(selectedSlot || fromDate || toDate);

  const handleClearFilters = () => {
    setSelectedSlot('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const handleOpenAdd = () => {
    navigate('/readings/new');
  };

  const handleOpenEdit = (reading) => {
    navigate(`/readings/${reading.id}/edit`, { state: { reading } });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingReading(null);
  };

  const handleFormSuccess = (payload) => {
    handleCloseModal();
    refetch();
    if (payload?.value && payload.value < 70) {
      setHypoAlertValue(payload.value);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Page Masthead */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-2 border-b border-[#EAE3DB]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#128B80]">
            Clinical Archive
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0F3336] tracking-tight mt-0.5">
            Glucose Log History
          </h1>
          <p className="mt-1 text-sm text-[#4D6B6D]">
            Comprehensive chronological log across all 4 circadian clinical meal slots.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadReadingsCsv(readings, `sweety-glucose-readings-page-${page}.csv`)
            }
            disabled={readings.length === 0}
            className="space-x-1.5"
          >
            <DownloadIcon className="h-4 w-4 text-[#128B80]" />
            <span>Export CSV</span>
          </Button>

          <Button size="sm" onClick={handleOpenAdd} className="space-x-1.5">
            <PlusIcon className="h-4 w-4" />
            <span>Log Reading</span>
          </Button>
        </div>
      </div>

      {/* 2. Filter Toolbar */}
      <Card className="p-4 bg-white border-[#EAE3DB]">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label
              htmlFor="slot-filter"
              className="block text-xs font-semibold uppercase tracking-wider text-[#4D6B6D] mb-1.5"
            >
              Filter by Slot
            </label>
            <select
              id="slot-filter"
              value={selectedSlot}
              onChange={(e) => {
                setSelectedSlot(e.target.value);
                setPage(1);
              }}
              className="flex h-10 w-full rounded-xl border border-[#EAE3DB] bg-white px-3.5 text-sm text-[#0F3336] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#128B80] transition-colors"
            >
              <option value="">All Meal Slots</option>
              {SLOT_VALUES.map((slot) => (
                <option key={slot} value={slot}>
                  {formatSlot(slot)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="from-date-filter"
              className="block text-xs font-semibold uppercase tracking-wider text-[#4D6B6D] mb-1.5"
            >
              From Date
            </label>
            <input
              id="from-date-filter"
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="flex h-10 w-full rounded-xl border border-[#EAE3DB] bg-white px-3.5 text-sm text-[#0F3336] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#128B80] transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="to-date-filter"
              className="block text-xs font-semibold uppercase tracking-wider text-[#4D6B6D] mb-1.5"
            >
              To Date
            </label>
            <input
              id="to-date-filter"
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="flex h-10 w-full rounded-xl border border-[#EAE3DB] bg-white px-3.5 text-sm text-[#0F3336] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#128B80] transition-colors"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-[#EAE3DB] flex items-center justify-between text-xs">
            <span className="text-[#4D6B6D]">
              Filtering applied to current log query.
            </span>
            <button
              type="button"
              onClick={handleClearFilters}
              className="font-semibold text-[#195A5F] hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </Card>

      {/* Error Banner */}
      {isError && (
        <div
          role="alert"
          className="rounded-xl border border-[#991B1B]/30 bg-[#FEE2E2]/60 p-4 text-xs font-medium text-[#991B1B]"
        >
          Failed to load readings: {error?.message || 'Server error'}
        </div>
      )}

      {/* 3. Readings Table Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <ReadingsTable
            readings={readings}
            isLoading={isLoading}
            onEdit={handleOpenEdit}
            onDelete={(r) => setDeletingReading(r)}
            onAddClick={handleOpenAdd}
          />
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </CardContent>
      </Card>

      {/* Modal fallback if modal editing is triggered */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reading-form-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-lg rounded-2xl border border-[#EAE3DB] bg-white p-6 shadow-2xl">
            <h3 id="reading-form-title" className="text-lg font-bold text-[#0F3336] mb-4">
              {editingReading ? 'Edit Blood Glucose Reading' : 'Log Blood Glucose Reading'}
            </h3>
            <ReadingForm
              initialData={editingReading}
              onSuccess={handleFormSuccess}
              onCancel={handleCloseModal}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteReadingDialog
        reading={deletingReading}
        isOpen={Boolean(deletingReading)}
        onClose={() => setDeletingReading(null)}
      />

      {/* Severe Hypoglycemia Emergency Alert Modal */}
      <HypoglycemiaAlertModal
        value={hypoAlertValue}
        isOpen={Boolean(hypoAlertValue)}
        onClose={() => setHypoAlertValue(null)}
      />
    </div>
  );
}
