import React from 'react';
import { ReportCard } from './ReportCard.jsx';
import { Card, CardContent } from '../../../components/ui/Card.jsx';

export function ReportStats({ report }) {
  const count = report?.count ?? 0;
  const average = count > 0 && report?.average !== null ? report.average : null;
  const lowest = count > 0 && report?.lowest !== null ? report.lowest : null;
  const highest = count > 0 && report?.highest !== null ? report.highest : null;
  const a1c = count > 0 && report?.estimatedA1c !== null ? `${report.estimatedA1c}%` : null;

  const tir = report?.timeInRange || {
    inRangePct: 0,
    lowPct: 0,
    highPct: 0,
    total: 0,
  };

  return (
    <div className="space-y-4">
      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportCard
          title="Average Glucose"
          value={average}
          unit="mg/dL"
          subtitle={count > 0 ? 'Target: 70–180 mg/dL' : 'No data in range'}
        />
        <ReportCard
          title="Lowest Reading"
          value={lowest}
          unit="mg/dL"
          subtitle={lowest && lowest < 70 ? 'Hypoglycemia detected' : undefined}
          alert={Boolean(lowest && lowest < 70)}
        />
        <ReportCard
          title="Highest Reading"
          value={highest}
          unit="mg/dL"
          subtitle={highest && highest > 180 ? 'Hyperglycemia detected' : undefined}
          alert={Boolean(highest && highest > 250)}
        />
        <ReportCard
          title="Estimated A1C"
          value={a1c}
          subtitle={count >= 14 ? 'ADA (avg+46.7)/28.7' : 'Requires multi-day data'}
        />
      </div>

      {/* Time in Range (TIR) International Standard Bar */}
      <Card className="border-slate-200">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Time In Range (TIR)</h4>
              <p className="text-xs text-slate-500">
                ADA Target: &gt; 70% in target range (70–180 mg/dL)
              </p>
            </div>
            <div className="text-xs font-semibold text-slate-700">
              {count > 0 ? `${count} total logged readings` : '—'}
            </div>
          </div>

          {count > 0 ? (
            <div>
              {/* Stacked Progress Bar */}
              <div className="flex h-4 w-full rounded-full overflow-hidden bg-slate-100">
                {tir.lowPct > 0 && (
                  <div
                    style={{ width: `${tir.lowPct}%` }}
                    className="bg-rose-500 transition-all duration-300"
                    title={`Low (<70 mg/dL): ${tir.lowPct}%`}
                  />
                )}
                {tir.inRangePct > 0 && (
                  <div
                    style={{ width: `${tir.inRangePct}%` }}
                    className="bg-emerald-500 transition-all duration-300"
                    title={`In Target (70-180 mg/dL): ${tir.inRangePct}%`}
                  />
                )}
                {tir.highPct > 0 && (
                  <div
                    style={{ width: `${tir.highPct}%` }}
                    className="bg-amber-500 transition-all duration-300"
                    title={`High (>180 mg/dL): ${tir.highPct}%`}
                  />
                )}
              </div>

              {/* TIR Legend */}
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-md bg-rose-50 p-2 text-rose-800">
                  <div className="font-bold">{tir.lowPct}%</div>
                  <div className="text-[11px] text-rose-600">Low (&lt; 70)</div>
                </div>
                <div className="rounded-md bg-emerald-50 p-2 text-emerald-800">
                  <div className="font-bold">{tir.inRangePct}%</div>
                  <div className="text-[11px] text-emerald-600">Target (70–180)</div>
                </div>
                <div className="rounded-md bg-amber-50 p-2 text-amber-800">
                  <div className="font-bold">{tir.highPct}%</div>
                  <div className="text-[11px] text-amber-600">High (&gt; 180)</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-sm text-slate-400">
              — No readings available to calculate Time-in-Range —
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
