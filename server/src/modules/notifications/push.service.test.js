import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PushService } from './push.service.js';

describe('PushService Unit Tests', () => {
  let mockStore;
  let mockPushEngine;
  let service;

  beforeEach(() => {
    mockStore = {
      save: vi.fn().mockResolvedValue(undefined),
      getByUser: vi.fn().mockResolvedValue([]),
      remove: vi.fn().mockResolvedValue(undefined),
    };
    mockPushEngine = {
      sendNotification: vi.fn().mockResolvedValue({}),
      setVapidDetails: vi.fn(),
    };
    service = new PushService(mockStore, mockPushEngine);
  });

  it('returns valid VAPID public key string', () => {
    const key = service.getPublicKey();
    expect(typeof key).toBe('string');
    expect(key.length).toBeGreaterThan(20);
  });

  it('delegates subscription saving to push store', async () => {
    const sub = {
      endpoint: 'https://push.example.com/sub/123',
      keys: { p256dh: 'key1', auth: 'auth1' },
    };
    await service.subscribe('patient-1', sub);
    expect(mockStore.save).toHaveBeenCalledWith('patient-1', sub);
  });

  it('delegates unsubscribe to push store', async () => {
    await service.unsubscribe('patient-1', 'https://push.example.com/sub/123');
    expect(mockStore.remove).toHaveBeenCalledWith('patient-1', 'https://push.example.com/sub/123');
  });

  it('returns 0 sent and 0 failed when user has no active subscriptions', async () => {
    mockStore.getByUser.mockResolvedValue([]);
    const res = await service.sendToUser('patient-1', { title: 'Test' });
    expect(res).toEqual({ sent: 0, failed: 0 });
    expect(mockPushEngine.sendNotification).not.toHaveBeenCalled();
  });

  it('delivers push notification to all subscriptions of a user', async () => {
    const subs = [
      { endpoint: 'https://push.example.com/1', keys: { p256dh: 'k1', auth: 'a1' } },
      { endpoint: 'https://push.example.com/2', keys: { p256dh: 'k2', auth: 'a2' } },
    ];
    mockStore.getByUser.mockResolvedValue(subs);

    const res = await service.sendToUser('patient-1', { title: 'Reminder', body: 'Log glucose' });
    expect(res).toEqual({ sent: 2, failed: 0 });
    expect(mockPushEngine.sendNotification).toHaveBeenCalledTimes(2);
  });

  it('removes dead subscription if push service returns 410 Gone or 404', async () => {
    const expiredSub = { endpoint: 'https://push.example.com/dead', keys: { p256dh: 'k', auth: 'a' } };
    mockStore.getByUser.mockResolvedValue([expiredSub]);

    const error410 = new Error('Subscription has expired');
    error410.statusCode = 410;
    mockPushEngine.sendNotification.mockRejectedValue(error410);

    const res = await service.sendToUser('patient-1', { title: 'Test' });
    expect(res).toEqual({ sent: 0, failed: 1 });
    expect(mockStore.remove).toHaveBeenCalledWith('patient-1', 'https://push.example.com/dead');
  });

  it('sendTestNotification dispatches standard test message', async () => {
    const sendSpy = vi.spyOn(service, 'sendToUser').mockResolvedValue({ sent: 1, failed: 0 });
    const res = await service.sendTestNotification('patient-1');

    expect(sendSpy).toHaveBeenCalledWith('patient-1', expect.objectContaining({
      title: expect.stringContaining('Sweety'),
    }));
    expect(res).toEqual({ sent: 1, failed: 0 });
  });
});
