import React from 'react';
import { getReadingClinicalAssessment } from '@sweety/shared/utils/clinical.js';
import { formatSlot, formatGlucose } from '../../../lib/format.js';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';

export function ReadingRow({ reading, onEdit, onDelete }) {
  const assessment = getReadingClinicalAssessment(reading.value, reading.slot);

  const badgeVariant =
    assessment.color === 'green'
      ? 'success'
      : assessment.color === 'rose' || assessment.color === 'red'
        ? 'danger'
        : 'warning';

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/75 transition-colors">
      <td className="py-3.5 pl-4 pr-3 text-sm sm:pl-6">
        <div className="font-semibold text-slate-900">{formatSlot(reading.slot)}</div>
        {(reading.carbsGrams != null || reading.insulinUnits != null || reading.notes) && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
            {reading.carbsGrams != null && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/70 font-medium">
                🍞 {reading.carbsGrams}g
              </span>
            )}
            {reading.insulinUnits != null && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200/70 font-medium">
                💉 {reading.insulinUnits}u
              </span>
            )}
            {reading.notes && <span className="text-slate-500">{reading.notes}</span>}
          </div>
        )}
      </td>
      <td className="px-3 py-3.5 text-sm text-slate-700 whitespace-nowrap">
        {reading.readingDate}
      </td>
      <td className="px-3 py-3.5 text-sm whitespace-nowrap font-medium text-slate-900">
        <div className="flex items-center space-x-2">
          <span>{formatGlucose(reading.value)}</span>
          <Badge variant={badgeVariant} className="text-xs">
            {assessment.label}
          </Badge>
        </div>
      </td>
      <td className="py-3.5 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 whitespace-nowrap space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(reading)}
          aria-label={`Edit reading for ${formatSlot(reading.slot)} on ${reading.readingDate}`}
        >
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(reading)}
          aria-label={`Delete reading for ${formatSlot(reading.slot)} on ${reading.readingDate}`}
        >
          Delete
        </Button>
      </td>
    </tr>
  );
}
