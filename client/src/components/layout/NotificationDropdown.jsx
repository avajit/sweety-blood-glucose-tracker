import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext.jsx';
import { useReadings } from '../../features/readings/hooks/useReadings.js';
import { ROLES } from '@sweety/shared/constants/roles.js';
import { todayInTimezone } from '@sweety/shared/utils/date.js';
import { BellIcon, ClockIcon, CheckIcon, PlusIcon, SettingsIcon } from '../icons/index.jsx';

export function NotificationDropdown() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const isPatient = Boolean(isAuthenticated && user?.role === ROLES.PATIENT);

  // Fetch readings only for patients to calculate today's pending slots
  const today = todayInTimezone();
  const { data: readingsResponse } = useReadings({ limit: 50 }, { enabled: isPatient });
  const readings = readingsResponse?.data || [];

  const todayReadings = readings.filter((r) => {
    const rDate = typeof r.readingDate === 'string' ? r.readingDate.substring(0, 10) : '';
    return rDate === today;
  });

  const countToday = todayReadings.length;
  const pendingCount = isPatient ? Math.max(0, 4 - countToday) : 0;
  const hasUnread = pendingCount > 0;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Bell Action Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-[#4D6B6D] hover:text-[#0F3336] hover:bg-[#EAE3DB]/50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#195A5F]"
        aria-label="View notifications and reminders"
        aria-expanded={isOpen}
      >
        <BellIcon className="h-5 w-5" />
        {/* Unread Indicator Badge */}
        {hasUnread && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D0976C] text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {pendingCount}
          </span>
        )}
      </button>

      {/* Floating Notifications Popover */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications Panel"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-[#EAE3DB] bg-white shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#EAE3DB] bg-[#F3EDE6]/50">
            <div>
              <h3 className="text-sm font-semibold font-serif text-[#0F3336]">
                Notifications
              </h3>
              <p className="text-[11px] text-[#4D6B6D]">
                Daily reminder schedule & clinical alerts
              </p>
            </div>
            {hasUnread ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#D0976C]/20 text-[#8C5832]">
                {pendingCount} pending
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#128B80]/15 text-[#195A5F]">
                All caught up
              </span>
            )}
          </div>

          {/* Notification Items List */}
          <div className="divide-y divide-[#EAE3DB]/60 max-h-80 overflow-y-auto">
            {/* 1. Daily Meal Slot Adherence Item */}
            {isPatient && (
              <div className="p-3.5 hover:bg-[#F3EDE6]/30 transition-colors">
                <div className="flex items-start space-x-3">
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                      hasUnread
                        ? 'bg-[#D0976C]/20 text-[#8C5832]'
                        : 'bg-[#128B80]/15 text-[#195A5F]'
                    }`}
                  >
                    {hasUnread ? (
                      <ClockIcon className="h-4 w-4" />
                    ) : (
                      <CheckIcon className="h-4 w-4" strokeWidth={2} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-[#0F3336]">
                        {hasUnread ? 'Pending Meal Slot Readings' : 'Daily Logs Complete'}
                      </h4>
                      <span className="text-[10px] text-[#4D6B6D]">Today</span>
                    </div>
                    <p className="text-xs text-[#4D6B6D] mt-0.5">
                      {hasUnread
                        ? `You have logged ${countToday}/4 readings today. Please log your remaining ${pendingCount} slot(s).`
                        : 'Great adherence! All 4 daily blood glucose meal slots are recorded.'}
                    </p>
                    {hasUnread && (
                      <div className="mt-2">
                        <Link
                          to="/dashboard"
                          onClick={() => setIsOpen(false)}
                          className="inline-flex items-center space-x-1 text-xs font-semibold text-[#195A5F] hover:text-[#128B80] transition-colors"
                        >
                          <PlusIcon className="h-3 w-3" />
                          <span>Log now on Dashboard</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 2. Web Push Notification Setting Status */}
            <div className="p-3.5 hover:bg-[#F3EDE6]/30 transition-colors">
              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 rounded-lg bg-[#195A5F]/10 text-[#195A5F] flex items-center justify-center shrink-0">
                  <BellIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-[#0F3336]">
                    Automated Reminders Active
                  </h4>
                  <p className="text-xs text-[#4D6B6D] mt-0.5">
                    Sweety checks your schedule every evening and notifies you if slots are missing.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Link */}
          <div className="p-2.5 border-t border-[#EAE3DB] bg-[#F3EDE6]/40 text-center">
            <Link
              to="/settings"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center space-x-1.5 text-xs font-medium text-[#4D6B6D] hover:text-[#0F3336] transition-colors"
            >
              <SettingsIcon className="h-3.5 w-3.5 text-[#195A5F]" />
              <span>Notification Preferences in Settings</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
