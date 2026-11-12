import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { isPushSupported, subscribeToPush } from '../../../utils/push.js';
import { getVapidPublicKey, subscribePush, unsubscribePush, sendTestPush } from '../../../api/notifications.api.js';

export function PushNotificationCard() {
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

    // Check if browser already has an active push subscription
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

      // 1. Fetch backend VAPID public key
      const publicKey = await getVapidPublicKey();

      // 2. Request browser permission and create push subscription via service worker
      const sub = await subscribeToPush(publicKey);

      // 3. Register subscription with backend
      await subscribePush(sub.toJSON ? sub.toJSON() : sub);

      setIsSubscribed(true);
      setCurrentSubscription(sub);
      setMessage('Push notifications enabled! You will receive daily reminders.');
    } catch (err) {
      setError(err.message || 'Failed to enable push notifications.');
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

      await sendTestPush();
      setMessage('Test alert dispatched to your browser!');
    } catch (err) {
      setError(err.message || 'Failed to send test push alert.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!supported) {
    return (
      <Card className="border-slate-200 bg-slate-50/50">
        <CardHeader className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-slate-800">Browser Push Reminders</CardTitle>
            <Badge variant="outline" className="text-xs text-slate-500">Not Supported</Badge>
          </div>
          <CardDescription className="text-xs text-slate-500">
            Push notifications are not supported in this browser environment.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30">
      <CardHeader className="p-4 sm:p-5 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-lg" role="img" aria-label="bell">🔔</span>
            <CardTitle className="text-base text-slate-900">Daily Glucose Reminders</CardTitle>
          </div>
          <Badge variant={isSubscribed ? 'success' : 'outline'} className="text-xs">
            {isSubscribed ? 'Active' : 'Disabled'}
          </Badge>
        </div>
        <CardDescription className="text-xs text-slate-600 mt-1">
          Receive browser push notifications when daily meal slot readings are missing.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-0 space-y-3">
        {error && (
          <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800">
            {error}
          </div>
        )}

        {message && (
          <div role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800">
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
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
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
              >
                Send Test Notification
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDisablePush}
                isLoading={isLoading}
                disabled={isLoading}
                className="text-slate-500 hover:text-slate-700"
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
