import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext.jsx';
import { ROLES } from '@sweety/shared/constants/roles.js';
import { HomeIcon, ClockIcon, BarChartIcon, SettingsIcon } from '../icons/index.jsx';

export function PatientBottomNavigation() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || user?.role !== ROLES.PATIENT) {
    return null;
  }

  const items = [
    { to: '/dashboard', label: 'Home', icon: HomeIcon },
    { to: '/readings', label: 'Readings', icon: ClockIcon },
    { to: '/reports', label: 'Reports', icon: BarChartIcon },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#EAE3DB] bg-white/95 backdrop-blur-sm px-2 py-1.5 transition-colors"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-3 text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'text-[#195A5F] font-semibold'
                    : 'text-[#4D6B6D] hover:text-[#0F3336]'
                }`
              }
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
