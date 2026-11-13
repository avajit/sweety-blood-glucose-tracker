import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext.jsx';
import { ROLES } from '@sweety/shared/constants/roles.js';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { SweetyBrandmark } from '../icons/index.jsx';

export function Navbar() {
  const { user, isAuthenticated, logout, isLoggingOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  const navLinkClass = ({ isActive }) =>
    `inline-flex items-center px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-colors ${
      isActive
        ? 'bg-[#195A5F] text-white shadow-subtle'
        : 'text-[#4D6B6D] hover:text-[#0F3336] hover:bg-[#EAE3DB]/60'
    }`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#EAE3DB] bg-white/95 backdrop-blur-sm transition-colors">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Desktop Navigation */}
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-2.5 group">
            <SweetyBrandmark className="h-8 w-8 transition-transform group-hover:scale-105" />
            <span className="text-xl font-bold tracking-tight text-[#0F3336]">
              Sweety<span className="text-[#128B80]">.</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          {isAuthenticated && (
            <nav className="hidden md:flex md:space-x-1.5" aria-label="Main Navigation">
              {user?.role === ROLES.DOCTOR ? (
                <NavLink to="/doctor/patients" className={navLinkClass}>
                  My Patients
                </NavLink>
              ) : (
                <>
                  <NavLink to="/dashboard" className={navLinkClass}>
                    Dashboard
                  </NavLink>
                  <NavLink to="/readings" className={navLinkClass}>
                    Log History
                  </NavLink>
                  <NavLink to="/reports" className={navLinkClass}>
                    Clinical Reports
                  </NavLink>
                  <NavLink to="/settings" className={navLinkClass}>
                    Settings
                  </NavLink>
                </>
              )}
            </nav>
          )}
        </div>

        {/* Right Section: User Profile & Actions */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold text-[#0F3336] leading-none">
                  {user?.name}
                </span>
                <span className="text-xs text-[#4D6B6D] mt-0.5">
                  {user?.email}
                </span>
              </div>
              <Badge variant={user?.role === ROLES.DOCTOR ? 'secondary' : 'outline'}>
                {user?.role === ROLES.DOCTOR ? 'Doctor' : 'Patient'}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                isLoading={isLoggingOut}
                aria-label="Log out"
              >
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Register</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
