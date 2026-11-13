import React from 'react';
import { getReadingClinicalAssessment } from '@sweety/shared/utils/clinical.js';
import { formatSlot, formatGlucose } from '../../../lib/format.js';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card.jsx';
import {
  SlotFastingIcon,
  SlotBreakfastIcon,
  SlotLunchIcon,
  SlotDinnerIcon,
  CarbsIcon,
  InsulinIcon,
} from '../../../components/icons/index.jsx';

const slotIcons = {
  MORNING_FASTING: SlotFastingIcon,
  AFTER_BREAKFAST: SlotBreakfastIcon,
  AFTER_LUNCH: SlotLunchIcon,
  AFTER_DINNER: SlotDinnerIcon,
};

export function DailyReadingsList({ readings = [] }) {
  if (!readings || readings.length === 0) return null;

  return (
    <Card className="border-[#EAE3DB] bg-white overflow-hidden">
      <CardHeader className="pb-3 border-b border-[#EAE3DB] bg-[#F3EDE6]/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-serif font-bold text-[#0F3336]">
            Readings Log ({readings.length})
          </CardTitle>
          <span className="text-xs text-[#4D6B6D]">
            Logged chronological records in active window
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#EAE3DB]">
            <thead className="bg-[#F3EDE6]/40">
              <tr>
                <th scope="col" className="py-3 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-[#4D6B6D] sm:pl-6">
                  Slot
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#4D6B6D]">
                  Date
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#4D6B6D]">
                  Glucose
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#4D6B6D]">
                  Clinical Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE3DB] bg-white">
              {readings.map((reading) => {
                const assessment = getReadingClinicalAssessment(reading.value, reading.slot);
                const badgeVariant =
                  assessment.color === 'green'
                    ? 'target'
                    : assessment.color === 'rose' || assessment.color === 'red'
                      ? 'critical'
                      : assessment.color === 'yellow' || assessment.color === 'amber'
                        ? 'low'
                        : 'high';

                const SlotIcon = slotIcons[reading.slot] || SlotFastingIcon;

                return (
                  <tr key={reading.id} className="hover:bg-[#F3EDE6]/25 transition-colors">
                    <td className="py-3.5 pl-4 pr-3 text-sm font-semibold text-[#0F3336] sm:pl-6">
                      <div className="flex items-center space-x-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F3EDE6] text-[#195A5F]">
                          <SlotIcon className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div>{formatSlot(reading.slot)}</div>
                          {(reading.carbsGrams != null || reading.insulinUnits != null || reading.notes) && (
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs font-normal">
                              {reading.carbsGrams != null && (
                                <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded-full bg-[#D0976C]/15 text-[#8C5832] text-[10px]">
                                  <CarbsIcon className="h-3 w-3" />
                                  <span>{reading.carbsGrams}g</span>
                                </span>
                              )}
                              {reading.insulinUnits != null && (
                                <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded-full bg-[#128B80]/15 text-[#195A5F] text-[10px]">
                                  <InsulinIcon className="h-3 w-3" />
                                  <span>{reading.insulinUnits}u</span>
                                </span>
                              )}
                              {reading.notes && (
                                <span className="text-[#4D6B6D] italic text-xs truncate max-w-[150px]">
                                  {reading.notes}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-xs sm:text-sm text-[#4D6B6D] whitespace-nowrap tabular-nums">
                      {reading.readingDate}
                    </td>
                    <td className="px-3 py-3.5 text-sm sm:text-base font-bold tabular-nums text-[#0F3336] whitespace-nowrap">
                      {formatGlucose(reading.value)}
                    </td>
                    <td className="px-3 py-3.5 text-sm whitespace-nowrap">
                      <Badge variant={badgeVariant} className="text-xs">
                        {assessment.label}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
