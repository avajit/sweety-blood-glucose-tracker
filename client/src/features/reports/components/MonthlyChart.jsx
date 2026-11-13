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
import { formatSlot, formatGlucose } from '../../../lib/format.js';
import { getReadingClinicalAssessment } from '@sweety/shared/utils/clinical.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const assessment = getReadingClinicalAssessment(data.value, data.rawSlot);
    const badgeVariant =
      assessment.color === 'green'
        ? 'target'
        : assessment.color === 'rose' || assessment.color === 'red'
          ? 'critical'
          : 'high';

    return (
      <div className="rounded-xl border border-[#EAE3DB] bg-white p-3.5 shadow-xl text-xs space-y-1.5 min-w-[170px]">
        <div className="flex items-center justify-between text-[#4D6B6D] text-[11px] pb-1 border-b border-[#EAE3DB]">
          <span className="font-semibold">{data.date}</span>
          <span>{formatSlot(data.rawSlot)}</span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-lg font-bold tabular-nums text-[#0F3336]">
            {formatGlucose(data.value)}
          </span>
          <Badge variant={badgeVariant} className="text-[10px] py-0 px-2">
            {assessment.label}
          </Badge>
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
    <Card className="border-[#EAE3DB] bg-white">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-serif font-bold text-[#0F3336]">
              Glucose Trend & Target Zone
            </CardTitle>
            <CardDescription className="text-xs text-[#4D6B6D]">
              Green shaded band represents ADA target range (70–180 mg/dL)
            </CardDescription>
          </div>
          <div className="flex items-center space-x-4 text-xs font-medium text-[#4D6B6D]">
            <span className="flex items-center">
              <span className="mr-1.5 h-2.5 w-2.5 rounded-full bg-[#195A5F]" />
              Glucose Level
            </span>
            <span className="flex items-center">
              <span className="mr-1.5 h-2.5 w-2.5 rounded bg-[#1B6B2E]/20 border border-[#1B6B2E]/50" />
              Target (70–180)
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {!hasData ? (
          <div className="flex h-64 flex-col items-center justify-center text-center text-[#4D6B6D]">
            <svg
              className="h-10 w-10 text-[#4D6B6D]/40 mb-2"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <p className="text-sm font-semibold text-[#0F3336]">
              No readings in selected range
            </p>
            <p className="text-xs text-[#4D6B6D] mt-0.5">
              Log glucose readings across your meal slots to visualize clinical trends.
            </p>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height={280} minWidth={0}>
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#EAE3DB"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  stroke="#4D6B6D"
                  fontSize={11}
                  tickMargin={8}
                />
                <YAxis
                  domain={[40, 'auto']}
                  tickLine={false}
                  stroke="#4D6B6D"
                  fontSize={11}
                  tickMargin={8}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* ADA Target Zone Shaded Band (70 - 180 mg/dL) */}
                <ReferenceArea
                  y1={70}
                  y2={180}
                  fill="#1B6B2E"
                  fillOpacity={0.08}
                />
                <ReferenceLine
                  y={70}
                  stroke="#1B6B2E"
                  strokeDasharray="3 3"
                  strokeOpacity={0.6}
                />
                <ReferenceLine
                  y={180}
                  stroke="#1B6B2E"
                  strokeDasharray="3 3"
                  strokeOpacity={0.6}
                />

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#195A5F"
                  strokeWidth={2.5}
                  dot={{
                    r: 4,
                    fill: '#195A5F',
                    strokeWidth: 1,
                    stroke: '#ffffff',
                  }}
                  activeDot={{ r: 6, fill: '#128B80' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
