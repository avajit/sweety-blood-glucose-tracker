import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SLOT_VALUES } from '@sweety/shared/constants/slots.js';
import { LIMITS } from '@sweety/shared/constants/limits.js';
import { todayInTimezone } from '@sweety/shared/utils/date.js';
import { getReadingClinicalAssessment } from '@sweety/shared/utils/clinical.js';
import { useReadings } from '../hooks/useReadings.js';
import { ReadingForm } from '../components/ReadingForm.jsx';
import { DeleteReadingDialog } from '../components/DeleteReadingDialog.jsx';
import { HypoglycemiaAlertModal } from '../components/HypoglycemiaAlertModal.jsx';
import { ReadingsTable } from '../components/ReadingsTable.jsx';
import { formatSlot, formatGlucose } from '../../../lib/format.js';
import { Button } from '../../../components/ui/Button.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';

export default function DashboardPage() {
  const today = todayInTimezone();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const [editingReading, setEditingReading] = useState(null);
  const [deletingReading, setDeletingReading] = useState(null);
  const [hypoAlertValue, setHypoAlertValue] = useState(null);

  // Fetch today's readings
  const { data, isLoading, refetch } = useReadings({
    from: today,
    to: today,
    limit: 10,
  });

  const todayReadings = data?.data || [];

  // Group readings by slot
  const slotMap = new Map();
  todayReadings.forEach((r) => slotMap.set(r.slot, r));

  const countToday = todayReadings.length;
  const avgToday =
    countToday > 0
      ? Math.round(todayReadings.reduce((sum, r) => sum + r.value, 0) / countToday)
      : null;

  const handleOpenAdd = (slot = null) => {
    setActiveSlot(slot);
    setEditingReading(slot ? { slot, date: today } : null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (reading) => {
    setEditingReading(reading);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingReading(null);
    setActiveSlot(null);
  };

  const handleFormSuccess = (payload) => {
    handleCloseModal();
    refetch();
    if (payload?.value && payload.value < 70) {
      setHypoAlertValue(payload.value);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Patient Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Daily log tracking for <strong className="text-slate-700">{today}</strong>
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link to="/reports">
            <Button variant="outline">View Clinical Reports</Button>
          </Link>
          <Button
            onClick={() => handleOpenAdd()}
            disabled={countToday >= LIMITS.READINGS_PER_DAY}
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
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Log Reading
          </Button>
        </div>
      </div>

      {/* Daily Progress & Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase">Daily Adherence</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900">
              {countToday} / {LIMITS.READINGS_PER_DAY}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((countToday / LIMITS.READINGS_PER_DAY) * 100, 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {countToday === LIMITS.READINGS_PER_DAY
                ? 'All 4 clinical slots logged for today.'
                : `${LIMITS.READINGS_PER_DAY - countToday} slots remaining today.`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase">Today&apos;s Mean Glucose</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900">
              {formatGlucose(avgToday)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">
              {avgToday ? 'ADA Target: 70–180 mg/dL' : 'No readings logged today yet'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase">Log Status</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900">
              {countToday >= LIMITS.READINGS_PER_DAY ? (
                <span className="text-emerald-600">Complete</span>
              ) : (
                <span className="text-amber-600">In Progress</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">
              Up to 4 readings per day across standard meal slots.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 4 Clinical Slots Today */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-3">Today&apos;s Meal Slot Tracker</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SLOT_VALUES.map((slot) => {
            const reading = slotMap.get(slot);
            const assessment = reading ? getReadingClinicalAssessment(reading.value, slot) : null;

            return (
              <Card
                key={slot}
                className={`transition-all border ${reading ? 'border-slate-200 bg-white' : 'border-dashed border-slate-300 bg-slate-50/50'}`}
              >
                <CardContent className="p-4 flex flex-col justify-between h-36">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      {formatSlot(slot)}
                    </span>
                    {assessment && (
                      <Badge
                        variant={
                          assessment.color === 'green'
                            ? 'success'
                            : assessment.color === 'rose' || assessment.color === 'red'
                              ? 'danger'
                              : 'warning'
                        }
                      >
                        {assessment.label}
                      </Badge>
                    )}
                  </div>

                  {reading ? (
                    <div>
                      <div className="text-2xl font-extrabold text-slate-900">
                        {formatGlucose(reading.value)}
                      </div>
                      {reading.notes && (
                        <p className="text-xs text-slate-500 line-clamp-1 italic mt-0.5">
                          {reading.notes}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-xs text-slate-400">Not recorded yet</p>
                    </div>
                  )}

                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                    {reading ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(reading)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => setDeletingReading(reading)}
                        >
                          Delete
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        disabled={countToday >= LIMITS.READINGS_PER_DAY}
                        onClick={() => handleOpenAdd(slot)}
                      >
                        + Log Slot
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Today's Log History */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900">Today&apos;s Readings</h2>
          <Link to="/readings" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500">
            View full log history &rarr;
          </Link>
        </div>
        <Card className="overflow-hidden border-slate-200">
          <CardContent className="p-0">
            <ReadingsTable
              readings={todayReadings}
              isLoading={isLoading}
              onEdit={handleOpenEdit}
              onDelete={(r) => setDeletingReading(r)}
              onAddClick={() => handleOpenAdd()}
            />
          </CardContent>
        </Card>
      </div>

      {/* Add / Edit Reading Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dashboard-form-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 id="dashboard-form-title" className="text-lg font-bold text-slate-900 mb-4">
              {editingReading?.id ? 'Edit Reading' : 'Log Blood Glucose Reading'}
            </h3>
            <ReadingForm
              initialData={editingReading || (activeSlot ? { slot: activeSlot, date: today } : null)}
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

