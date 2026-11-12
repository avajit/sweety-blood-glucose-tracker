import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card.jsx';

export function ReportCard({ title, value, unit, subtitle, alert = false }) {
  const displayValue = value === null || value === undefined || value === '' ? '—' : value;

  return (
    <Card className="border-slate-200">
      <CardContent className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </p>
        <div className="mt-2 flex items-baseline space-x-1.5">
          <span className={`text-2xl font-extrabold tracking-tight ${alert ? 'text-rose-600' : 'text-slate-900'}`}>
            {displayValue}
          </span>
          {displayValue !== '—' && unit && (
            <span className="text-xs font-medium text-slate-500">{unit}</span>
          )}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
