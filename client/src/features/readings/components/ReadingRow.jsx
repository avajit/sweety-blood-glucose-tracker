import React, { useState } from 'react';
import { getReadingClinicalAssessment } from '@sweety/shared/utils/clinical.js';
import { formatSlot, formatGlucose } from '../../../lib/format.js';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import {
  SlotFastingIcon,
  SlotBreakfastIcon,
  SlotLunchIcon,
  SlotDinnerIcon,
  ChevronDownIcon,
  CarbsIcon,
  InsulinIcon,
  NotesIcon,
} from '../../../components/icons/index.jsx';

const slotIcons = {
  MORNING_FASTING: SlotFastingIcon,
  AFTER_BREAKFAST: SlotBreakfastIcon,
  AFTER_LUNCH: SlotLunchIcon,
  AFTER_DINNER: SlotDinnerIcon,
};

export function ReadingRow({
  reading,
  onEdit,
  onDelete,
  isExpanded: controlledExpanded,
  onToggleExpand,
}) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const toggleExpand = () => {
    if (onToggleExpand) {
      onToggleExpand(reading.id);
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

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
  const hasCorrelates =
    reading.carbsGrams != null || reading.insulinUnits != null || Boolean(reading.notes);

  return (
    <>
      <tr
        className={`border-b border-[#EAE3DB] transition-colors cursor-pointer ${
          isExpanded
            ? 'bg-[#F3EDE6]/50'
            : 'hover:bg-[#F3EDE6]/25 bg-white'
        }`}
        onClick={toggleExpand}
      >
        {/* Clinical Slot & Quick Correlates */}
        <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F3EDE6] text-[#195A5F]">
              <SlotIcon className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-[#0F3336]">
                {formatSlot(reading.slot)}
              </div>
              {hasCorrelates && (
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                  {reading.carbsGrams != null && (
                    <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full bg-[#D0976C]/15 text-[#8C5832] font-medium text-[11px]">
                      <CarbsIcon className="h-3 w-3" />
                      <span>{reading.carbsGrams}g</span>
                    </span>
                  )}
                  {reading.insulinUnits != null && (
                    <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full bg-[#128B80]/15 text-[#195A5F] font-medium text-[11px]">
                      <InsulinIcon className="h-3 w-3" />
                      <span>{reading.insulinUnits}u</span>
                    </span>
                  )}
                  {reading.notes && (
                    <span className="inline-flex items-center space-x-1 text-[#4D6B6D] text-xs">
                      <NotesIcon className="h-3 w-3 shrink-0" />
                      <span className="truncate max-w-[120px] sm:max-w-[180px]">{reading.notes}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </td>

        {/* Reading Date / Timestamp */}
        <td className="px-3 py-4 text-sm text-[#4D6B6D] whitespace-nowrap">
          <span className="tabular-nums font-medium">{reading.readingDate}</span>
        </td>

        {/* Glucose Level + Clinical Status Badge */}
        <td className="px-3 py-4 text-sm whitespace-nowrap">
          <div className="flex items-center space-x-2.5">
            <span className="text-base sm:text-lg font-bold tabular-nums text-[#0F3336]">
              {formatGlucose(reading.value)}
            </span>
            <Badge variant={badgeVariant} className="text-xs">
              {assessment.label}
            </Badge>
          </div>
        </td>

        {/* Row Actions + Chevron */}
        <td
          className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 whitespace-nowrap"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(reading)}
              aria-label={`Edit reading for ${formatSlot(reading.slot)} on ${reading.readingDate}`}
              className="text-xs h-7 px-2.5"
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(reading)}
              aria-label={`Delete reading for ${formatSlot(reading.slot)} on ${reading.readingDate}`}
              className="text-xs h-7 px-2.5"
            >
              Delete
            </Button>
            <button
              type="button"
              onClick={toggleExpand}
              className="p-1 text-[#4D6B6D] hover:text-[#0F3336] transition-transform"
              aria-label={isExpanded ? 'Collapse reading details' : 'Expand reading details'}
            >
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180 text-[#128B80]' : ''
                }`}
              />
            </button>
          </div>
        </td>
      </tr>

      {/* Accordion Expanded Details View */}
      {isExpanded && (
        <tr className="bg-[#F3EDE6]/40 border-b border-[#EAE3DB]">
          <td colSpan={4} className="px-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="rounded-lg border border-[#EAE3DB] bg-white p-3">
                <span className="font-semibold uppercase tracking-wider text-[#4D6B6D] block mb-1">
                  Carbohydrates
                </span>
                <span className="text-sm font-medium text-[#0F3336] tabular-nums">
                  {reading.carbsGrams != null ? `${reading.carbsGrams} grams` : 'None recorded'}
                </span>
              </div>

              <div className="rounded-lg border border-[#EAE3DB] bg-white p-3">
                <span className="font-semibold uppercase tracking-wider text-[#4D6B6D] block mb-1">
                  Rapid-Acting Insulin
                </span>
                <span className="text-sm font-medium text-[#0F3336] tabular-nums">
                  {reading.insulinUnits != null ? `${reading.insulinUnits} units` : 'None recorded'}
                </span>
              </div>

              <div className="rounded-lg border border-[#EAE3DB] bg-white p-3">
                <span className="font-semibold uppercase tracking-wider text-[#4D6B6D] block mb-1">
                  Clinical Notes
                </span>
                <p className="text-xs text-[#0F3336] italic">
                  {reading.notes ? `“${reading.notes}”` : 'No notes attached to this reading.'}
                </p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
