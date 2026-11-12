import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReadingService } from './reading.service.js';
import {
  DailyLimitError,
  ConflictError,
  FutureDateError,
  NotFoundError,
  ForbiddenError,
} from '../../common/errors/httpErrors.js';
import { createMockReading } from '../../../tests/factories/reading.factory.js';

describe('ReadingService', () => {
  let mockRepo;
  let service;

  beforeEach(() => {
    mockRepo = {
      countByUserAndDate: vi.fn(),
      findByUserDateAndSlot: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      findManyByUser: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    service = new ReadingService(mockRepo);
  });

  describe('createReading', () => {
    it('creates and returns a new reading when all clinical & limit rules pass', async () => {
      mockRepo.countByUserAndDate.mockResolvedValue(2);
      mockRepo.findByUserDateAndSlot.mockResolvedValue(null);
      const mockRecord = createMockReading({
        userId: 'user-1',
        date: '2026-11-10',
        slot: 'AFTER_LUNCH',
        value: 135,
        notes: 'Lunch salad',
      });
      mockRepo.create.mockResolvedValue(mockRecord);

      const result = await service.createReading('user-1', {
        date: '2026-11-10',
        slot: 'AFTER_LUNCH',
        value: 135,
        notes: 'Lunch salad',
      });

      expect(result.id).toBe(mockRecord.id);
      expect(result.readingDate).toBe('2026-11-10');
      expect(result.slot).toBe('AFTER_LUNCH');
      expect(result.value).toBe(135);
      expect(result.notes).toBe('Lunch salad');
    });

    it('throws FutureDateError when the reading date is in the future', async () => {
      await expect(
        service.createReading('user-1', {
          date: '2099-01-01',
          slot: 'MORNING_FASTING',
          value: 100,
        }),
      ).rejects.toBeInstanceOf(FutureDateError);

      expect(mockRepo.countByUserAndDate).not.toHaveBeenCalled();
    });

    it('throws DailyLimitError when patient already recorded 4 readings for that date', async () => {
      mockRepo.countByUserAndDate.mockResolvedValue(4);

      await expect(
        service.createReading('user-1', {
          date: '2026-11-10',
          slot: 'AFTER_DINNER',
          value: 140,
        }),
      ).rejects.toBeInstanceOf(DailyLimitError);
    });

    it('throws DailyLimitError when day has 4 readings even if submitted slot is a duplicate', async () => {
      // Precedence Rule: Daily limit check runs before duplicate slot check
      mockRepo.countByUserAndDate.mockResolvedValue(4);

      await expect(
        service.createReading('user-1', {
          date: '2026-11-10',
          slot: 'MORNING_FASTING',
          value: 110,
        }),
      ).rejects.toBeInstanceOf(DailyLimitError);

      expect(mockRepo.findByUserDateAndSlot).not.toHaveBeenCalled();
    });

    it('throws ConflictError when day has <4 readings but the requested slot is already logged', async () => {
      mockRepo.countByUserAndDate.mockResolvedValue(2);
      mockRepo.findByUserDateAndSlot.mockResolvedValue({ id: 'existing-slot' });

      await expect(
        service.createReading('user-1', {
          date: '2026-11-10',
          slot: 'AFTER_BREAKFAST',
          value: 120,
        }),
      ).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe('getReadings', () => {
    it('returns paginated readings with correct skip/take calculations', async () => {
      mockRepo.findManyByUser.mockResolvedValue({
        data: [createMockReading({ id: 'r-1' }), createMockReading({ id: 'r-2' })],
        total: 45,
      });

      const result = await service.getReadings('user-1', { page: 2, limit: 20 });

      expect(mockRepo.findManyByUser).toHaveBeenCalledWith('user-1', {
        skip: 20,
        take: 20,
        from: undefined,
        to: undefined,
      });
      expect(result.data.length).toBe(2);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
      expect(result.total).toBe(45);
      expect(result.totalPages).toBe(3); // Math.ceil(45 / 20) = 3
    });

    it('returns totalPages = 0 on empty dataset', async () => {
      mockRepo.findManyByUser.mockResolvedValue({ data: [], total: 0 });

      const result = await service.getReadings('user-1', { page: 1, limit: 20 });

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('updateReading', () => {
    it('updates reading when authenticated user is the owner', async () => {
      const existing = createMockReading({ id: 'r-10', userId: 'user-1', value: 90 });
      mockRepo.findById.mockResolvedValue(existing);
      mockRepo.update.mockResolvedValue({ ...existing, value: 105, notes: 'Retested' });

      const result = await service.updateReading('user-1', 'r-10', { value: 105, notes: 'Retested' });

      expect(result.value).toBe(105);
      expect(result.notes).toBe('Retested');
    });

    it('throws ForbiddenError when non-owner attempts to update', async () => {
      const existing = createMockReading({ id: 'r-10', userId: 'victim-user' });
      mockRepo.findById.mockResolvedValue(existing);

      await expect(
        service.updateReading('attacker-user', 'r-10', { value: 999 }),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('throws NotFoundError when reading does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateReading('user-1', 'nonexistent', { value: 100 }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('deleteReading', () => {
    it('deletes reading when authenticated user is the owner', async () => {
      const existing = createMockReading({ id: 'r-20', userId: 'user-1' });
      mockRepo.findById.mockResolvedValue(existing);
      mockRepo.delete.mockResolvedValue(existing);

      await service.deleteReading('user-1', 'r-20');

      expect(mockRepo.delete).toHaveBeenCalledWith('r-20');
    });

    it('throws ForbiddenError when non-owner attempts to delete', async () => {
      const existing = createMockReading({ id: 'r-20', userId: 'victim-user' });
      mockRepo.findById.mockResolvedValue(existing);

      await expect(
        service.deleteReading('attacker-user', 'r-20'),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('throws NotFoundError when deleting non-existent reading', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.deleteReading('user-1', 'ghost-reading')).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
