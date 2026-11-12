import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';
import { formatSlot, formatGlucose, getClinicalMeta } from '../../../lib/format.js';
import { getReadingClinicalAssessment } from '@sweety/shared/utils/clinical.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card.jsx';

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const assessment = getReadingClinicalAssessment(data.value, data.rawSlot);
    const meta = getClinicalMeta(assessment.code);

    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg text-xs space-y-1">
        <p className="font-bold text-slate-900">{data.date}</p>
        <p className="text-slate-600">{formatSlot(data.rawSlot)}</p>
        <div className="flex items-center space-x-2 pt-1">
          <span className="text-base font-extrabold text-slate-900">
            {formatGlucose(data.value)}
          </span>
          <span className={`rounded px-1.5 py-0.5 font-semibold text-[11px] ${meta.badgeClass}`}>
            {assessment.label}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

export function MonthlyChart({ readings = [] }) {
  const hasData = Array.isArray(readings) && readings.length > 0;

  const chartData = hasData
    ? readings.map((r, index) => ({
        index,
        date: r.readingDate || r.date || '',
        rawSlot: r.slot,
        slot: formatSlot(r.slot),
        value: Number(r.value),
      }))
    : [];

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Glucose Trend & Target Zone
            </CardTitle>
            <CardDescription className="text-xs">
              Green shaded band represents ADA target range (70–180 mg/dL)
            </CardDescription>
          </div>
          <div className="flex items-center space-x-4 text-xs font-medium text-slate-600">
            <span className="flex items-center">
              <span className="mr-1.5 h-2.5 w-2.5 rounded-full bg-indigo-600" />
              Glucose Level
            </span>
            <span className="flex items-center">
              <span className="mr-1.5 h-2.5 w-2.5 rounded bg-emerald-100 border border-emerald-300" />
              Target (70–180)
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {!hasData ? (
          <div className="flex h-64 flex-col items-center justify-center text-center text-slate-400">
            <svg
              className="h-10 w-10 text-slate-300 mb-2"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <p className="text-sm font-medium">No readings in selected range</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Log glucose readings to visualize clinical trends.
            </p>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height={280} minWidth={0}>
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickMargin={8}
                />
                <YAxis
                  domain={[40, 'auto']}
                  tickLine={false}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickMargin={8}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* ADA Target Zone Shaded Band (70 - 180 mg/dL) */}
                <ReferenceArea
                  y1={70}
                  y2={180}
                  fill="#10b981"
                  fillOpacity={0.08}
                />
                <ReferenceLine y={70} stroke="#10b981" strokeDasharray="3 3" opacity={0.6} />
                <ReferenceLine y={180} stroke="#10b981" strokeDasharray="3 3" opacity={0.6} />

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#4f46e5', strokeWidth: 1, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#4338ca' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
