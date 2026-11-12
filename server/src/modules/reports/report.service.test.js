import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportService } from './report.service.js';
import { FutureDateError, ForbiddenError } from '../../common/errors/httpErrors.js';
import { createMockReading } from '../../../tests/factories/reading.factory.js';

describe('ReportService', () => {
  let mockReportRepo;
  let reportService;
  const patientUser = { id: 'patient-uuid-1', role: 'PATIENT' };
  const doctorUser = { id: 'doctor-uuid-1', role: 'DOCTOR' };

  beforeEach(() => {
    mockReportRepo = {
      getReportData: vi.fn(),
      isDoctorLinkedToPatient: vi.fn(),
    };
    reportService = new ReportService(mockReportRepo);
  });

  it('rejects future reference date with FutureDateError', async () => {
    await expect(
      reportService.getReport(patientUser, 'daily', { date: '2099-01-01' }),
    ).rejects.toThrow(FutureDateError);
  });

  it('computes correct statistics, rounding average to nearest integer and calculating eA1C and TIR', async () => {
    const mockReadings = [
      createMockReading({ id: 'r1', value: 95, slot: 'MORNING_FASTING' }),
      createMockReading({ id: 'r2', value: 140, slot: 'AFTER_BREAKFAST' }),
      createMockReading({ id: 'r3', value: 165, slot: 'AFTER_LUNCH' }),
    ];

    mockReportRepo.getReportData.mockResolvedValue({
      stats: {
        _count: { id: 3 },
        _min: { value: 95 },
        _max: { value: 165 },
        _avg: { value: 133.33333333333334 },
      },
      readings: mockReadings,
    });

    const result = await reportService.getReport(patientUser, 'daily', { date: '2026-11-10' });

    expect(result.type).toBe('daily');
    expect(result.range).toEqual({ from: '2026-11-10', to: '2026-11-10' });
    expect(result.count).toBe(3);
    expect(result.highest).toBe(165);
    expect(result.lowest).toBe(95);
    expect(result.average).toBe(133); // Math.round(133.3333) = 133
    expect(result.estimatedA1c).toBe(6.3); // (133 + 46.7) / 28.7 ≈ 6.26 -> 6.3
    expect(result.timeInRange.inRangePct).toBe(100); // 95, 140, 165 are all between 70-180
    expect(result.readings.length).toBe(3);
  });

  it('handles empty state when zero readings are recorded', async () => {
    mockReportRepo.getReportData.mockResolvedValue({
      stats: {
        _count: { id: 0 },
        _min: { value: null },
        _max: { value: null },
        _avg: { value: null },
      },
      readings: [],
    });

    const result = await reportService.getReport(patientUser, 'monthly', { date: '2026-11-10' });

    expect(result.count).toBe(0);
    expect(result.highest).toBeNull();
    expect(result.lowest).toBeNull();
    expect(result.average).toBeNull();
    expect(result.estimatedA1c).toBeNull();
    expect(result.readings).toEqual([]);
    expect(result.timeInRange).toEqual({
      total: 0,
      inRangePct: 0,
      lowPct: 0,
      highPct: 0,
      hypoCount: 0,
      severeHypoCount: 0,
    });
  });

  it('handles single reading in period correctly', async () => {
    const singleReading = createMockReading({ id: 'r1', value: 110, slot: 'MORNING_FASTING' });

    mockReportRepo.getReportData.mockResolvedValue({
      stats: {
        _count: { id: 1 },
        _min: { value: 110 },
        _max: { value: 110 },
        _avg: { value: 110 },
      },
      readings: [singleReading],
    });

    const result = await reportService.getReport(patientUser, 'daily', { date: '2026-11-10' });

    expect(result.count).toBe(1);
    expect(result.highest).toBe(110);
    expect(result.lowest).toBe(110);
    expect(result.average).toBe(110);
  });

  describe('access control & role enforcement', () => {
    it('throws ForbiddenError when a patient requests another patientId', async () => {
      await expect(
        reportService.getReport(patientUser, 'daily', {
          date: '2026-11-10',
          patientId: 'different-patient-uuid',
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('allows doctor to view report for linked patient', async () => {
      mockReportRepo.isDoctorLinkedToPatient.mockResolvedValue(true);
      mockReportRepo.getReportData.mockResolvedValue({
        stats: { _count: { id: 0 }, _min: { value: null }, _max: { value: null }, _avg: { value: null } },
        readings: [],
      });

      const result = await reportService.getReport(doctorUser, 'daily', {
        date: '2026-11-10',
        patientId: 'linked-patient-uuid',
      });

      expect(mockReportRepo.isDoctorLinkedToPatient).toHaveBeenCalledWith(doctorUser.id, 'linked-patient-uuid');
      expect(mockReportRepo.getReportData).toHaveBeenCalledWith('linked-patient-uuid', '2026-11-10', '2026-11-10');
      expect(result.count).toBe(0);
    });

    it('throws ForbiddenError when doctor requests report for unlinked patient', async () => {
      mockReportRepo.isDoctorLinkedToPatient.mockResolvedValue(false);

      await expect(
        reportService.getReport(doctorUser, 'daily', {
          date: '2026-11-10',
          patientId: 'unlinked-patient-uuid',
        }),
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
