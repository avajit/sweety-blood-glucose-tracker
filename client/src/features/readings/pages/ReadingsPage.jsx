import React, { useState } from 'react';
import { SLOT_VALUES } from '@sweety/shared/constants/slots.js';
import { useReadings } from '../hooks/useReadings.js';
import { ReadingsTable } from '../components/ReadingsTable.jsx';
import { ReadingForm } from '../components/ReadingForm.jsx';
import { DeleteReadingDialog } from '../components/DeleteReadingDialog.jsx';
import { Pagination } from '../components/Pagination.jsx';
import { formatSlot } from '../../../lib/format.js';
import { Button } from '../../../components/ui/Button.jsx';
import { Card, CardContent } from '../../../components/ui/Card.jsx';
import { downloadReadingsCsv } from '../../../utils/csvExport.js';

export default function ReadingsPage() {
  const [page, setPage] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState(null);
  const [deletingReading, setDeletingReading] = useState(null);

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

  const handleOpenAdd = () => {
    setEditingReading(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (reading) => {
    setEditingReading(reading);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingReading(null);
  };

  const handleFormSuccess = () => {
    handleCloseModal();
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Glucose Log History</h1>
          <p className="mt-1 text-sm text-slate-500">
            View, filter, and manage your complete blood glucose log.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => downloadReadingsCsv(readings, `sweety-glucose-readings-page-${page}.csv`)}
            disabled={readings.length === 0}
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
            Export CSV
          </Button>
          <Button onClick={handleOpenAdd} className="shadow-sm">
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Log Reading
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-white border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="slot-filter" className="block text-xs font-semibold text-slate-600 mb-1">
              Filter by Slot
            </label>
            <select
              id="slot-filter"
              value={selectedSlot}
              onChange={(e) => {
                setSelectedSlot(e.target.value);
                setPage(1);
              }}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            <label htmlFor="from-date-filter" className="block text-xs font-semibold text-slate-600 mb-1">
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
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="to-date-filter" className="block text-xs font-semibold text-slate-600 mb-1">
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
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      </Card>

      {/* Error Banner */}
      {isError && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          Failed to load readings: {error?.message || 'Server error'}
        </div>
      )}

      {/* Readings Table Card */}
      <Card className="overflow-hidden border-slate-200">
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reading-form-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 id="reading-form-title" className="text-lg font-bold text-slate-900 mb-4">
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
    </div>
  );
}
