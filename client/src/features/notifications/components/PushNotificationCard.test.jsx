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
});
