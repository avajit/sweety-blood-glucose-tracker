import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card.jsx';

export function ReportCard({ title, value, unit, subtitle, alert = false }) {
  const displayValue = value === null || value === undefined || value === '' ? '—' : value;

  return (
    <Card className="border-[#EAE3DB] bg-white">
      <CardContent className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#4D6B6D]">
          {title}
        </p>
        <div className="mt-2.5 flex items-baseline space-x-1.5">
          <span
            className={`text-2xl sm:text-3xl font-bold tabular-nums tracking-tight ${
              alert
                ? 'text-[#991B1B]'
                : 'text-[#0F3336]'
            }`}
          >
            {displayValue}
          </span>
          {displayValue !== '—' && unit && (
            <span className="text-xs font-semibold uppercase tracking-wider text-[#4D6B6D]">
              {unit}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-1.5 text-xs text-[#4D6B6D]">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
