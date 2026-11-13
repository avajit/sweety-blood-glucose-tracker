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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
          subtitle={lowest && lowest < 70 ? 'Hypoglycemia detected' : count > 0 ? 'Daily baseline' : undefined}
          alert={Boolean(lowest && lowest < 70)}
        />
        <ReportCard
          title="Highest Reading"
          value={highest}
          unit="mg/dL"
          subtitle={highest && highest > 180 ? 'Hyperglycemia detected' : count > 0 ? 'Daily ceiling' : undefined}
          alert={Boolean(highest && highest > 250)}
        />
        <ReportCard
          title="Estimated A1C"
          value={a1c}
          subtitle={count >= 14 ? 'ADA standard formula' : 'Requires multi-day log'}
        />
      </div>

      {/* Time in Range (TIR) International Standard Bar */}
      <Card className="border-[#EAE3DB] bg-white">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <h4 className="text-sm font-serif font-bold text-[#0F3336]">
                Time In Range (TIR)
              </h4>
              <p className="text-xs text-[#4D6B6D] mt-0.5">
                ADA Target Benchmark: &gt; 70% in target range (70–180 mg/dL)
              </p>
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#4D6B6D] tabular-nums">
              {count > 0 ? `${count} total logged readings` : '—'}
            </div>
          </div>

          {count > 0 ? (
            <div>
              {/* Stacked Accessible TIR Progress Bar */}
              <div className="flex h-5 w-full rounded-full overflow-hidden bg-[#F3EDE6] p-0.5 border border-[#EAE3DB]">
                {tir.lowPct > 0 && (
                  <div
                    style={{ width: `${tir.lowPct}%` }}
                    className="bg-[#991B1B] rounded-l-full transition-all duration-300"
                    title={`Low (<70 mg/dL): ${tir.lowPct}%`}
                  />
                )}
                {tir.inRangePct > 0 && (
                  <div
                    style={{ width: `${tir.inRangePct}%` }}
                    className={`bg-[#128B80] transition-all duration-300 ${
                      tir.lowPct === 0 ? 'rounded-l-full' : ''
                    } ${tir.highPct === 0 ? 'rounded-r-full' : ''}`}
                    title={`In Target (70-180 mg/dL): ${tir.inRangePct}%`}
                  />
                )}
                {tir.highPct > 0 && (
                  <div
                    style={{ width: `${tir.highPct}%` }}
                    className="bg-[#D0976C] rounded-r-full transition-all duration-300"
                    title={`High (>180 mg/dL): ${tir.highPct}%`}
                  />
                )}
              </div>

              {/* TIR Clinical Legend Breakdown */}
              <div className="mt-4 grid grid-cols-3 gap-2.5 sm:gap-3 text-center text-xs">
                <div className="rounded-xl border border-[#991B1B]/20 bg-[#FEE2E2]/60 p-2.5 text-[#991B1B]">
                  <div className="text-base sm:text-lg font-bold tabular-nums">{tir.lowPct}%</div>
                  <div className="text-[11px] font-medium mt-0.5">Low (&lt; 70)</div>
                </div>
                <div className="rounded-xl border border-[#128B80]/30 bg-[#128B80]/10 p-2.5 text-[#195A5F]">
                  <div className="text-base sm:text-lg font-bold tabular-nums">{tir.inRangePct}%</div>
                  <div className="text-[11px] font-medium mt-0.5">Target (70–180)</div>
                </div>
                <div className="rounded-xl border border-[#D0976C]/30 bg-[#D0976C]/15 p-2.5 text-[#8C5832]">
                  <div className="text-base sm:text-lg font-bold tabular-nums">{tir.highPct}%</div>
                  <div className="text-[11px] font-medium mt-0.5">High (&gt; 180)</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-[#4D6B6D] italic border-t border-[#EAE3DB] mt-2">
              — No readings available to calculate Time-in-Range —
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
