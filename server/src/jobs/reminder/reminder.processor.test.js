import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createReminderProcessor, defaultNotifier } from '../../modules/reminders/reminder.processor.js';
import { startWorker } from '../../worker.js';
import { ROLES } from '@sweety/shared/constants/roles.js';

describe('Module 12 — BullMQ Reminder Processor', () => {
  let mockPrisma;
  let mockNotifier;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findMany: vi.fn(),
      },
      reading: {
        count: vi.fn(),
      },
    };

    mockNotifier = {
      sendReminder: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('patients with 4 readings today are not reminded', async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      { id: 'p-1', name: 'Diligent Patient', email: 'diligent@sweety.app' },
    ]);
    mockPrisma.reading.count.mockResolvedValue(4);

    const process = createReminderProcessor({
      prisma: mockPrisma,
      notifier: mockNotifier,
    });

    const summary = await process({ data: { date: '2026-11-12' } });

    expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
      where: { role: ROLES.PATIENT },
      select: expect.any(Object),
    });
    expect(mockPrisma.reading.count).toHaveBeenCalledWith({
      where: {
        userId: 'p-1',
        readingDate: new Date('2026-11-12'),
      },
    });
    expect(mockNotifier.sendReminder).not.toHaveBeenCalled();
    expect(summary).toEqual({
      referenceDate: '2026-11-12',
      totalPatients: 1,
      remindedCount: 0,
      skippedCount: 1,
    });
  });

  it('patients with < 4 readings today receive a reminder', async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      { id: 'p-2', name: 'Busy Patient', email: 'busy@sweety.app' },
    ]);
    mockPrisma.reading.count.mockResolvedValue(2);

    const process = createReminderProcessor({
      prisma: mockPrisma,
      notifier: mockNotifier,
    });

    const summary = await process({ data: { date: '2026-11-12' } });

    expect(mockNotifier.sendReminder).toHaveBeenCalledTimes(1);
    expect(mockNotifier.sendReminder).toHaveBeenCalledWith({
      patientId: 'p-2',
      name: 'Busy Patient',
      email: 'busy@sweety.app',
      count: 2,
      remaining: 2,
      date: '2026-11-12',
    });
    expect(summary).toEqual({
      referenceDate: '2026-11-12',
      totalPatients: 1,
      remindedCount: 1,
      skippedCount: 0,
    });
  });

  it('correctly handles a mixed cohort of completed and pending patients', async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      { id: 'p-complete', name: 'Complete Patient', email: 'complete@sweety.app' },
      { id: 'p-partial', name: 'Partial Patient', email: 'partial@sweety.app' },
      { id: 'p-zero', name: 'Zero Readings Patient', email: 'zero@sweety.app' },
    ]);

    mockPrisma.reading.count.mockImplementation(async ({ where }) => {
      if (where.userId === 'p-complete') return 4;
      if (where.userId === 'p-partial') return 1;
      return 0;
    });

    const process = createReminderProcessor({
      prisma: mockPrisma,
      notifier: mockNotifier,
    });

    const summary = await process({ data: { date: '2026-11-12' } });

    expect(mockNotifier.sendReminder).toHaveBeenCalledTimes(2);
    expect(mockNotifier.sendReminder).toHaveBeenCalledWith(
      expect.objectContaining({ patientId: 'p-partial', count: 1, remaining: 3 }),
    );
    expect(mockNotifier.sendReminder).toHaveBeenCalledWith(
      expect.objectContaining({ patientId: 'p-zero', count: 0, remaining: 4 }),
    );
    expect(summary).toEqual({
      referenceDate: '2026-11-12',
      totalPatients: 3,
      remindedCount: 2,
      skippedCount: 1,
    });
  });

  it('defaultNotifier logs reminder without throwing', async () => {
    await expect(
      defaultNotifier.sendReminder({
        patientId: 'p-1',
        name: 'Demo Patient',
        email: 'demo@sweety.app',
        count: 2,
        remaining: 2,
        date: '2026-11-12',
      }),
    ).resolves.toBeUndefined();
  });

  it('worker process exits cleanly when Redis is unavailable (logs warning, does not crash)', async () => {
    // startWorker returns null when REDIS_URL is unset / invalid without throwing unhandled exceptions
    const result = await startWorker();
    expect(result).toBeNull();
  });
});
