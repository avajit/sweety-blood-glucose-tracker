import React from 'react';
import { getReadingClinicalAssessment } from '@sweety/shared/utils/clinical.js';
import { formatSlot, formatGlucose } from '../../../lib/format.js';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Card, CardContent } from '../../../components/ui/Card.jsx';

export function ReadingCard({ reading, onEdit, onDelete }) {
  const assessment = getReadingClinicalAssessment(reading.value, reading.slot);

  const badgeVariant =
    assessment.color === 'green'
      ? 'success'
      : assessment.color === 'rose' || assessment.color === 'red'
        ? 'danger'
        : 'warning';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {formatSlot(reading.slot)}
          </span>
          <Badge variant={badgeVariant}>{assessment.label}</Badge>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <div className="text-2xl font-bold text-slate-900">{formatGlucose(reading.value)}</div>
          <div className="text-xs text-slate-500">{reading.readingDate}</div>
        </div>
        {reading.notes && (
          <p className="mt-1 text-xs text-slate-600 line-clamp-1 italic">{reading.notes}</p>
        )}
        <div className="mt-4 flex items-center justify-end space-x-2 border-t border-slate-100 pt-2">
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(reading)}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => onDelete(reading)}>
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

