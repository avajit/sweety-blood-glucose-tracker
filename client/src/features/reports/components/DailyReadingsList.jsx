import React from 'react';
import { getReadingClinicalAssessment } from '@sweety/shared/utils/clinical.js';
import { formatSlot, formatGlucose } from '../../../lib/format.js';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card.jsx';

export function DailyReadingsList({ readings = [] }) {
  if (!readings || readings.length === 0) return null;

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-slate-900">
          Readings Log ({readings.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="py-3 pl-4 pr-3 text-left text-xs font-semibold text-slate-600 sm:pl-6">
                  Slot
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-slate-600">
                  Date
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-slate-600">
                  Glucose
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-slate-600">
                  Clinical Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {readings.map((reading) => {
                const assessment = getReadingClinicalAssessment(reading.value, reading.slot);
                const badgeVariant =
                  assessment.color === 'green'
                    ? 'success'
                    : assessment.color === 'rose' || assessment.color === 'red'
                      ? 'danger'
                      : 'warning';

                return (
                  <tr key={reading.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3 pl-4 pr-3 text-sm font-semibold text-slate-900 sm:pl-6">
                      {formatSlot(reading.slot)}
                      {reading.notes && (
                        <div className="text-xs font-normal text-slate-500 mt-0.5 italic">{reading.notes}</div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {reading.readingDate}
                    </td>
                    <td className="px-3 py-3 text-sm font-bold text-slate-900 whitespace-nowrap">
                      {formatGlucose(reading.value)}
                    </td>
                    <td className="px-3 py-3 text-sm whitespace-nowrap">
                      <Badge variant={badgeVariant}>{assessment.label}</Badge>
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
