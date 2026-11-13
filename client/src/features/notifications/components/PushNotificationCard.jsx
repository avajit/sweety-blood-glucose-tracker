import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { useToast } from '../../../components/feedback/ToastContext.jsx';
import { isPushSupported, subscribeToPush } from '../../../utils/push.js';
import { getVapidPublicKey, subscribePush, unsubscribePush, sendTestPush } from '../../../api/notifications.api.js';

export function PushNotificationCard() {
  const toast = useToast();
  const [supported, setSupported] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isPushSupported()) {
      setSupported(false);
      return;
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => {
          if (sub) {
            setIsSubscribed(true);
            setCurrentSubscription(sub);
          }
        })
        .catch(() => {
          // Ignore readiness errors in unsupported/restricted environments
        });
    }
  }, []);

  const handleEnablePush = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setMessage(null);

      const publicKey = await getVapidPublicKey();
      const sub = await subscribeToPush(publicKey);
      await subscribePush(sub.toJSON ? sub.toJSON() : sub);

      setIsSubscribed(true);
      setCurrentSubscription(sub);
      setMessage('Push notifications enabled! You will receive daily reminders.');
    } catch (err) {
      if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
        setError("Notification permission was blocked in your browser. Click the site settings icon on the left of your address bar (next to localhost:5173), switch Notifications to 'Allow', and refresh.");
      } else {
        setError(err.message || 'Failed to enable push notifications.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisablePush = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setMessage(null);

      if (currentSubscription) {
        await unsubscribePush(currentSubscription.endpoint);
        await currentSubscription.unsubscribe();
      }

      setIsSubscribed(false);
      setCurrentSubscription(null);
      setMessage('Push notifications disabled.');
    } catch (err) {
      setError(err.message || 'Failed to disable push notifications.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTest = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setMessage(null);

      // Attempt server-side dispatch
      try {
        await sendTestPush();
      } catch {
        // Fallback to local ServiceWorker display if network push broker is restricted
      }

      let showedNative = false;

      // Only attempt OS-level notification if browser permission is explicitly granted
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready;
            if (reg && reg.showNotification) {
              await reg.showNotification('🔔 Sweety Daily Reminder', {
                body: 'Please remember to log your remaining blood glucose readings today!',
                icon: '/favicon.svg',
                badge: '/favicon.svg',
                tag: 'sweety-test-alert',
              });
              showedNative = true;
            }
          }
        } catch {
          // Native display failed, fall back to in-app notification
        }

        if (!showedNative) {
          try {
            new Notification('🔔 Sweety Daily Reminder', {
              body: 'Please remember to log your remaining blood glucose readings today!',
            });
            showedNative = true;
          } catch {
            // Fall back to in-app notification
          }
        }
      }

      if (showedNative) {
        setMessage('🔔 Test alert dispatched! Check the bottom-right corner of your screen.');
        toast.success('🔔 Sweety Reminder: Please remember to log your remaining blood glucose readings today!');
      } else {
        setMessage('🔔 Test reminder simulated: "Dear Demo Patient, please remember to log your remaining blood glucose readings today!"');
        toast.info('🔔 Sweety Reminder: Please remember to log your remaining blood glucose readings today!');
      }
    } catch (err) {
      setError(err.message || 'Failed to send test push alert.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!supported) {
    return (
      <Card className="border-[#EAE3DB] bg-white">
        <CardHeader className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#0F3336]">
              Browser Push Reminders
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              Not Supported
            </Badge>
          </div>
          <CardDescription className="text-xs text-[#4D6B6D] mt-1">
            Push notifications are not supported in this browser environment.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-[#EAE3DB] bg-white">
      <CardHeader className="p-4 sm:p-5 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#195A5F]/10 text-[#195A5F]">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <CardTitle className="text-base font-serif font-bold text-[#0F3336]">
              Daily Glucose Reminders
            </CardTitle>
          </div>
          <Badge variant={isSubscribed ? 'target' : 'outline'} className="text-xs">
            {isSubscribed ? 'Active' : 'Disabled'}
          </Badge>
        </div>
        <CardDescription className="text-xs text-[#4D6B6D] mt-1.5">
          Receive browser push notifications when daily meal slot readings are missing.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-0 space-y-3">
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-[#991B1B]/30 bg-[#FEE2E2]/60 p-2.5 text-xs text-[#991B1B]"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            className="rounded-xl border border-[#128B80]/30 bg-[#128B80]/10 p-2.5 text-xs text-[#195A5F]"
          >
            {message}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {!isSubscribed ? (
            <Button
              size="sm"
              onClick={handleEnablePush}
              isLoading={isLoading}
              disabled={isLoading}
              className="text-xs"
            >
              Enable Push Reminders
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendTest}
                isLoading={isLoading}
                disabled={isLoading}
                className="text-xs"
              >
                Send Test Notification
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDisablePush}
                isLoading={isLoading}
                disabled={isLoading}
                className="text-xs text-[#4D6B6D] hover:text-[#991B1B]"
              >
                Disable
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
