import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CacheService } from '../cache/cache.service.js';
import { ReportService } from './report.service.js';
import { ReadingService } from '../readings/reading.service.js';
import { ROLES } from '@sweety/shared/constants/roles.js';

describe('Module 11 — Redis Cache Unit Tests', () => {
  describe('CacheService (graceful degradation when Redis is null / unavailable)', () => {
    it('returns null on get() without throwing when Redis client is null', async () => {
      const cache = new CacheService(null);
      const result = await cache.get('report:user-1:daily:2026-11-12');
      expect(result).toBeNull();
    });

    it('no-ops on set(), del(), and invalidateUserReports() without throwing when Redis is null', async () => {
      const cache = new CacheService(null);
      await expect(cache.set('key', { test: true })).resolves.toBeUndefined();
      await expect(cache.del('key')).resolves.toBeUndefined();
      await expect(cache.invalidateUserReports('user-1')).resolves.toBeUndefined();
    });

    it('returns null and does not throw when Redis client throws an error on get()', async () => {
      const mockClient = {
        get: vi.fn().mockRejectedValue(new Error('Connection dropped')),
      };
      const cache = new CacheService(mockClient);
      const result = await cache.get('any-key');
      expect(result).toBeNull();
    });

    it('handles set() failure gracefully without throwing', async () => {
      const mockClient = {
        set: vi.fn().mockRejectedValue(new Error('Write failed')),
      };
      const cache = new CacheService(mockClient);
      await expect(cache.set('key', { data: 123 })).resolves.toBeUndefined();
    });

    it('invalidates user report keys matching report:{userId}:* pattern', async () => {
      const mockClient = {
        keys: vi.fn().mockResolvedValue(['report:u-1:daily:2026-11-12', 'report:u-1:monthly:2026-11-01']),
        del: vi.fn().mockResolvedValue(2),
      };
      const cache = new CacheService(mockClient);
      await cache.invalidateUserReports('u-1');

      expect(mockClient.keys).toHaveBeenCalledWith('report:u-1:*');
      expect(mockClient.del).toHaveBeenCalledWith(
        'report:u-1:daily:2026-11-12',
        'report:u-1:monthly:2026-11-01',
      );
    });
  });

  describe('ReportService caching behavior', () => {
    let mockReportRepo;
    let mockCacheService;
    let reportService;

    const mockUser = { id: 'u-100', role: ROLES.PATIENT };

    beforeEach(() => {
      mockReportRepo = {
        getReportData: vi.fn().mockResolvedValue({
          stats: {
            _count: { id: 2 },
            _max: { value: 140 },
            _min: { value: 95 },
            _avg: { value: 117.5 },
          },
          readings: [],
        }),
      };

      mockCacheService = {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(undefined),
      };

      reportService = new ReportService(mockReportRepo, mockCacheService);
    });

    it('checks cache before querying repository and caches on cache miss', async () => {
      const report = await reportService.getReport(mockUser, 'daily', { date: '2026-11-10' });

      expect(mockCacheService.get).toHaveBeenCalledWith('report:u-100:daily:2026-11-10');
      expect(mockReportRepo.getReportData).toHaveBeenCalledTimes(1);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'report:u-100:daily:2026-11-10',
        expect.objectContaining({
          type: 'daily',
          count: 2,
          highest: 140,
          lowest: 95,
          average: 118,
        }),
        60,
      );
      expect(report.count).toBe(2);
    });

    it('returns cached payload directly on cache hit without calling repository', async () => {
      const cachedPayload = {
        type: 'daily',
        range: { from: '2026-11-10', to: '2026-11-10' },
        count: 4,
        highest: 180,
        lowest: 85,
        average: 120,
        readings: [],
      };

      mockCacheService.get.mockResolvedValueOnce(cachedPayload);

      const report = await reportService.getReport(mockUser, 'daily', { date: '2026-11-10' });

      expect(mockCacheService.get).toHaveBeenCalledWith('report:u-100:daily:2026-11-10');
      expect(mockReportRepo.getReportData).not.toHaveBeenCalled();
      expect(report).toEqual(cachedPayload);
    });
  });

  describe('ReadingService cache invalidation', () => {
    let mockReadingRepo;
    let mockCacheService;
    let readingService;

    beforeEach(() => {
      mockReadingRepo = {
        countByUserAndDate: vi.fn().mockResolvedValue(1),
        findByUserDateAndSlot: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: 'r-1',
          userId: 'u-100',
          readingDate: new Date('2026-11-10'),
          slot: 'FASTING',
          value: 110,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        findById: vi.fn().mockResolvedValue({
          id: 'r-1',
          userId: 'u-100',
          readingDate: new Date('2026-11-10'),
          slot: 'FASTING',
          value: 110,
        }),
        update: vi.fn().mockResolvedValue({
          id: 'r-1',
          userId: 'u-100',
          readingDate: new Date('2026-11-10'),
          slot: 'FASTING',
          value: 115,
        }),
        delete: vi.fn().mockResolvedValue({ id: 'r-1' }),
      };

      mockCacheService = {
        invalidateUserReports: vi.fn().mockResolvedValue(undefined),
      };

      readingService = new ReadingService(mockReadingRepo, mockCacheService);
    });

    it('invalidates user reports on createReading()', async () => {
      await readingService.createReading('u-100', {
        date: '2026-11-10',
        slot: 'FASTING',
        value: 110,
      });

      expect(mockCacheService.invalidateUserReports).toHaveBeenCalledWith('u-100');
    });

    it('invalidates user reports on updateReading()', async () => {
      await readingService.updateReading('u-100', 'r-1', { value: 115 });

      expect(mockCacheService.invalidateUserReports).toHaveBeenCalledWith('u-100');
    });

    it('invalidates user reports on deleteReading()', async () => {
      await readingService.deleteReading('u-100', 'r-1');

      expect(mockCacheService.invalidateUserReports).toHaveBeenCalledWith('u-100');
    });
  });
});
