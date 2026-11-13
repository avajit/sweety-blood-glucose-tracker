import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PushNotificationCard } from './PushNotificationCard.jsx';
import * as pushUtils from '../../../utils/push.js';
import * as notificationsApi from '../../../api/notifications.api.js';

describe('PushNotificationCard Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders "Not Supported" state when push is unavailable in environment', () => {
    vi.spyOn(pushUtils, 'isPushSupported').mockReturnValue(false);

    render(<PushNotificationCard />);

    expect(screen.getByText(/browser push reminders/i)).toBeInTheDocument();
    expect(screen.getByText(/^not supported$/i)).toBeInTheDocument();
  });

  it('renders "Daily Glucose Reminders" and Enable button when push is supported', () => {
    vi.spyOn(pushUtils, 'isPushSupported').mockReturnValue(true);

    render(<PushNotificationCard />);

    expect(screen.getByText(/daily glucose reminders/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enable push reminders/i })).toBeInTheDocument();
    expect(screen.getByText(/disabled/i)).toBeInTheDocument();
  });

  it('successfully enables push notifications and displays "Active" status', async () => {
    vi.spyOn(pushUtils, 'isPushSupported').mockReturnValue(true);
    vi.spyOn(notificationsApi, 'getVapidPublicKey').mockResolvedValue('test-vapid-public-key');
    vi.spyOn(pushUtils, 'subscribeToPush').mockResolvedValue({
      endpoint: 'https://push.example.com/sub/1',
      toJSON: () => ({ endpoint: 'https://push.example.com/sub/1' }),
    });
    const subscribeSpy = vi.spyOn(notificationsApi, 'subscribePush').mockResolvedValue({ success: true });

    const user = userEvent.setup();
    render(<PushNotificationCard />);

    await user.click(screen.getByRole('button', { name: /enable push reminders/i }));

    await waitFor(() => {
      expect(subscribeSpy).toHaveBeenCalled();
      expect(screen.getByText(/active/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send test notification/i })).toBeInTheDocument();
    });
  });

  it('displays graceful error when user or browser blocks notification permission', async () => {
    vi.spyOn(pushUtils, 'isPushSupported').mockReturnValue(true);
    vi.spyOn(notificationsApi, 'getVapidPublicKey').mockResolvedValue('test-vapid-public-key');
    vi.spyOn(pushUtils, 'subscribeToPush').mockRejectedValue(new Error('Notification permission was denied.'));

    // Mock Notification.permission as denied
    window.Notification = { permission: 'denied' };

    const user = userEvent.setup();
    render(<PushNotificationCard />);

    await user.click(screen.getByRole('button', { name: /enable push reminders/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/notification permission was blocked/i);
    });
  });

  it('displays simulated in-app notification when native OS notification permission is not granted', async () => {
    vi.spyOn(pushUtils, 'isPushSupported').mockReturnValue(true);
    vi.spyOn(notificationsApi, 'getVapidPublicKey').mockResolvedValue('test-vapid-public-key');
    vi.spyOn(pushUtils, 'subscribeToPush').mockResolvedValue({
      endpoint: 'https://push.example.com/sub/1',
      toJSON: () => ({ endpoint: 'https://push.example.com/sub/1' }),
      unsubscribe: vi.fn(),
    });
    vi.spyOn(notificationsApi, 'subscribePush').mockResolvedValue({ success: true });
    vi.spyOn(notificationsApi, 'sendTestPush').mockResolvedValue({ success: true });

    // Native permission is 'default' or not granted
    window.Notification = { permission: 'default' };

    const user = userEvent.setup();
    render(<PushNotificationCard />);

    await user.click(screen.getByRole('button', { name: /enable push reminders/i }));
    await waitFor(() => expect(screen.getByText(/active/i)).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /send test notification/i }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/test reminder simulated/i);
    });
  });

  it('successfully triggers native notification when Notification.permission is granted', async () => {
    vi.spyOn(pushUtils, 'isPushSupported').mockReturnValue(true);
    vi.spyOn(notificationsApi, 'getVapidPublicKey').mockResolvedValue('test-vapid-public-key');
    vi.spyOn(pushUtils, 'subscribeToPush').mockResolvedValue({
      endpoint: 'https://push.example.com/sub/1',
      toJSON: () => ({ endpoint: 'https://push.example.com/sub/1' }),
      unsubscribe: vi.fn(),
    });
    vi.spyOn(notificationsApi, 'subscribePush').mockResolvedValue({ success: true });
    vi.spyOn(notificationsApi, 'sendTestPush').mockResolvedValue({ success: true });

    const showNotificationMock = vi.fn().mockResolvedValue(true);
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        ready: Promise.resolve({
          showNotification: showNotificationMock,
        }),
      },
      configurable: true,
    });
    window.Notification = { permission: 'granted' };

    const user = userEvent.setup();
    render(<PushNotificationCard />);

    await user.click(screen.getByRole('button', { name: /enable push reminders/i }));
    await waitFor(() => expect(screen.getByText(/active/i)).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /send test notification/i }));

    await waitFor(() => {
      expect(showNotificationMock).toHaveBeenCalledWith(
        expect.stringMatching(/Sweety Daily Reminder/i),
        expect.objectContaining({ body: expect.any(String) })
      );
      expect(screen.getByRole('status')).toHaveTextContent(/test alert dispatched/i);
    });
  });

  it('allows disabling push notifications and reverts to disabled state', async () => {
    vi.spyOn(pushUtils, 'isPushSupported').mockReturnValue(true);
    vi.spyOn(notificationsApi, 'getVapidPublicKey').mockResolvedValue('test-vapid-public-key');
    const unsubscribeMock = vi.fn().mockResolvedValue(true);
    vi.spyOn(pushUtils, 'subscribeToPush').mockResolvedValue({
      endpoint: 'https://push.example.com/sub/1',
      toJSON: () => ({ endpoint: 'https://push.example.com/sub/1' }),
      unsubscribe: unsubscribeMock,
    });
    vi.spyOn(notificationsApi, 'subscribePush').mockResolvedValue({ success: true });
    const unsubscribeApiSpy = vi.spyOn(notificationsApi, 'unsubscribePush').mockResolvedValue({ success: true });

    const user = userEvent.setup();
    render(<PushNotificationCard />);

    await user.click(screen.getByRole('button', { name: /enable push reminders/i }));
    await waitFor(() => expect(screen.getByText(/active/i)).toBeInTheDocument());

    const disableBtn = screen.getByRole('button', { name: /disable/i });
    await user.click(disableBtn);

    await waitFor(() => {
      expect(unsubscribeApiSpy).toHaveBeenCalledWith('https://push.example.com/sub/1');
      expect(unsubscribeMock).toHaveBeenCalled();
      expect(screen.getByText(/^disabled$/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /enable push reminders/i })).toBeInTheDocument();
    });
  });
});
