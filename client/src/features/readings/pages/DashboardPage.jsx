import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SLOT_VALUES } from '@sweety/shared/constants/slots.js';
import { LIMITS } from '@sweety/shared/constants/limits.js';
import { todayInTimezone } from '@sweety/shared/utils/date.js';
import { getReadingClinicalAssessment } from '@sweety/shared/utils/clinical.js';
import { useReadings } from '../hooks/useReadings.js';
import { useAuth } from '../../auth/context/AuthContext.jsx';
import { DeleteReadingDialog } from '../components/DeleteReadingDialog.jsx';
import { HypoglycemiaAlertModal } from '../components/HypoglycemiaAlertModal.jsx';
import { ReadingsTable } from '../components/ReadingsTable.jsx';
import { formatSlot, formatGlucose } from '../../../lib/format.js';
import { Button } from '../../../components/ui/Button.jsx';
import { Card, CardContent } from '../../../components/ui/Card.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import {
  SlotFastingIcon,
  SlotBreakfastIcon,
  SlotLunchIcon,
  SlotDinnerIcon,
  PlusIcon,
  BarChartIcon,
} from '../../../components/icons/index.jsx';

const slotIcons = {
  MORNING_FASTING: SlotFastingIcon,
  AFTER_BREAKFAST: SlotBreakfastIcon,
  AFTER_LUNCH: SlotLunchIcon,
  AFTER_DINNER: SlotDinnerIcon,
};

export default function DashboardPage() {
  const today = todayInTimezone();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [deletingReading, setDeletingReading] = useState(null);
  const [hypoAlertValue, setHypoAlertValue] = useState(null);

  // Fetch today's readings
  const { data, isLoading } = useReadings({
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

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';

  const handleOpenAdd = (slot = null) => {
    navigate('/readings/new', { state: { slot } });
  };

  const handleOpenEdit = (reading) => {
    navigate(`/readings/${reading.id}/edit`, { state: { reading } });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Clinical Masthead */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-2 border-b border-[#EAE3DB]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#128B80]">
            Patient Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0F3336] tracking-tight mt-0.5">
            {greeting}, {user?.name || 'Alex'}
          </h1>
          <p className="mt-1 text-sm text-[#4D6B6D]">
            Daily clinical log tracking for <span className="font-medium text-[#0F3336]">{today}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Link to="/reports">
            <Button variant="outline" size="sm" className="space-x-1.5">
              <BarChartIcon className="h-4 w-4 text-[#128B80]" />
              <span>View Reports</span>
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={() => handleOpenAdd()}
            disabled={countToday >= LIMITS.READINGS_PER_DAY}
            className="space-x-1.5"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Log a reading</span>
          </Button>
        </div>
      </div>

      {/* 2. Prominent Glucose Overview (White Content Surface) */}
      <Card className="overflow-hidden border-[#EAE3DB] bg-white shadow-subtle">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#EAE3DB]">
          {/* Main Hero: Today's Mean Glucose */}
          <div className="p-6 sm:p-7 md:col-span-2 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#4D6B6D]">
                Today&apos;s Mean Glucose
              </span>
              <div className="mt-3 flex items-baseline space-x-3">
                <span className="text-4xl sm:text-5xl font-bold tabular-nums tracking-tight text-[#0F3336]">
                  {avgToday ? avgToday : '—'}
                </span>
                <span className="text-sm font-semibold uppercase tracking-wider text-[#4D6B6D]">
                  mg/dL
                </span>
                {avgToday && (
                  <Badge
                    variant={avgToday >= 70 && avgToday <= 180 ? 'target' : avgToday < 70 ? 'low' : 'high'}
                    className="ml-2"
                  >
                    {avgToday >= 70 && avgToday <= 180 ? 'In Target Range' : avgToday < 70 ? 'Hypoglycemia' : 'Elevated'}
                  </Badge>
                )}
              </div>
            </div>
            <p className="mt-4 text-xs text-[#4D6B6D]">
              {avgToday
                ? 'Calculated across all completed meal slots today. Standard ADA target: 70–180 mg/dL.'
                : 'No readings recorded yet for today. Log your first slot to view clinical metrics.'}
            </p>
          </div>

          {/* Right Supporting Adherence Group (Secondary Grouping on Muted Surface) */}
          <div className="p-6 sm:p-7 flex flex-col justify-between bg-[#EAE3DB]/30">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#4D6B6D]">
                Daily Adherence
              </span>
              <div className="mt-3 flex items-baseline">
                <span className="text-3xl font-bold tabular-nums text-[#0F3336]">
                  {countToday} / {LIMITS.READINGS_PER_DAY}
                </span>
              </div>
              <p className="mt-2 text-xs text-[#4D6B6D]">
                {countToday >= LIMITS.READINGS_PER_DAY
                  ? 'All 4 clinical slots completed.'
                  : `${LIMITS.READINGS_PER_DAY - countToday} reading slots pending.`}
              </p>
            </div>

            <div className="pt-4 border-t border-[#EAE3DB] mt-4 flex items-center justify-between text-xs">
              <span className="font-medium text-[#4D6B6D]">Log Status</span>
              <span className={`font-semibold ${countToday >= LIMITS.READINGS_PER_DAY ? 'text-[#1B6B2E]' : 'text-[#92400E]'}`}>
                {countToday >= LIMITS.READINGS_PER_DAY ? 'Complete' : 'In Progress'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Daily Reading Slots (Circadian Horizontal Timeline) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-serif font-bold text-[#0F3336]">
            Today&apos;s Meal Slots
          </h2>
          <span className="text-xs text-[#4D6B6D]">4 clinical slots daily</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {SLOT_VALUES.map((slot) => {
            const reading = slotMap.get(slot);
            const assessment = reading ? getReadingClinicalAssessment(reading.value, slot) : null;
            const Icon = slotIcons[slot] || SlotFastingIcon;

            return (
              <Card
                key={slot}
                className={`relative flex flex-col justify-between p-4 sm:p-5 transition-all ${
                  reading
                    ? 'border-[#EAE3DB] bg-white shadow-subtle'
                    : 'border-dashed border-[#D4C9BF] bg-white/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4 text-[#128B80]" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#4D6B6D]">
                        {formatSlot(slot)}
                      </span>
                    </div>
                    {assessment && (
                      <Badge
                        variant={
                          assessment.color === 'green'
                            ? 'target'
                            : assessment.color === 'rose' || assessment.color === 'red'
                              ? 'critical'
                              : 'low'
                        }
                      >
                        {assessment.label}
                      </Badge>
                    )}
                  </div>

                  {reading ? (
                    <div className="mt-1">
                      <div className="text-2xl font-bold tabular-nums text-[#0F3336]">
                        {formatGlucose(reading.value)}
                      </div>
                      {(reading.carbsGrams != null || reading.insulinUnits != null || reading.notes) && (
                        <p className="text-xs text-[#4D6B6D] line-clamp-1 mt-1">
                          {reading.carbsGrams != null && `${reading.carbsGrams}g carbs `}
                          {reading.insulinUnits != null && `${reading.insulinUnits}u insulin `}
                          {reading.notes && `• ${reading.notes}`}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="py-2">
                      <p className="text-xs text-[#4D6B6D]/60 italic">Not logged yet</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#EAE3DB] flex items-center justify-end space-x-2">
                  {reading ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(reading)}
                        className="text-xs h-7 px-2.5"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingReading(reading)}
                        className="text-xs h-7 px-2.5 text-[#991B1B] hover:text-[#7F1D1D] hover:bg-[#FEE2E2]/30"
                      >
                        Delete
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-8"
                      disabled={countToday >= LIMITS.READINGS_PER_DAY}
                      onClick={() => handleOpenAdd(slot)}
                    >
                      + Log Slot
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 4. Today's Reading Activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-serif font-bold text-[#0F3336]">
            Today&apos;s Readings
          </h2>
          <Link
            to="/readings"
            className="text-xs font-semibold text-[#195A5F] hover:text-[#14484B] hover:underline"
          >
            View full log history &rarr;
          </Link>
        </div>

        <Card className="overflow-hidden border-[#EAE3DB] bg-white shadow-subtle">
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
