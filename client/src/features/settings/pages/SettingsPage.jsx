import React from 'react';
import { useAuth } from '../../auth/context/AuthContext.jsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { PushNotificationCard } from '../../notifications/components/PushNotificationCard.jsx';
import { UserIcon, LogoutIcon } from '../../../components/icons/index.jsx';

export default function SettingsPage() {
  const { user, logout, isLoggingOut } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">
      {/* Editorial Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0F3336] tracking-tight">
          Account & Preferences
        </h1>
        <p className="mt-1 text-sm text-[#4D6B6D]">
          Manage your clinical profile and reminder notifications.
        </p>
      </div>

      {/* Profile Section */}
      <Card className="border-[#EAE3DB] bg-white">
        <CardHeader>
          <div className="flex items-center space-x-2.5">
            <UserIcon className="h-5 w-5 text-[#195A5F]" />
            <CardTitle className="text-base font-serif font-bold text-[#0F3336]">Clinical Profile</CardTitle>
          </div>
          <CardDescription className="text-xs text-[#4D6B6D]">Your registered identity and platform authorization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-[#EAE3DB]">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#4D6B6D]">Full Name</span>
            <span className="text-sm font-semibold text-[#0F3336]">{user?.name}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[#EAE3DB]">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#4D6B6D]">Email Address</span>
            <span className="text-sm font-medium text-[#0F3336]">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#4D6B6D]">Assigned Role</span>
            <Badge variant="outline">{user?.role}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications Section */}
      <PushNotificationCard />

      {/* Sign Out Card */}
      <Card className="border-[#EAE3DB] bg-white">
        <CardContent className="p-5 sm:p-6 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-[#0F3336]">Session Control</h4>
            <p className="text-xs text-[#4D6B6D] mt-0.5">Safely terminate your authenticated session on this device</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            isLoading={isLoggingOut}
            className="text-[#991B1B] border-[#991B1B]/30 hover:bg-[#FEE2E2]/40 hover:text-[#7F1D1D] shrink-0"
          >
            <LogoutIcon className="mr-1.5 h-4 w-4" />
            Log Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
