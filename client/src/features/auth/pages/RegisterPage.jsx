import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser.js';
import { RegisterForm } from '../components/RegisterForm.jsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card.jsx';
import { LoadingSpinner } from '../../../components/feedback/LoadingSpinner.jsx';
import { SweetyBrandmark } from '../../../components/icons/index.jsx';

export default function RegisterPage() {
  const { isAuthenticated, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3EDE6]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center pt-12 sm:pt-20 pb-12 bg-[#F3EDE6] px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand & Editorial Wordmark (Fixed top position) */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center space-x-3 mb-1.5">
            <SweetyBrandmark className="h-9 w-9 shrink-0 shadow-subtle" />
            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#0F3336]">
              Sweety<span className="text-[#128B80]">.</span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#4D6B6D]">
            Clinical Blood Glucose Monitoring Platform
          </p>
        </div>

        {/* Auth Surface */}
        <Card className="border-[#EAE3DB] shadow-subtle bg-white">
          <CardHeader className="space-y-1 pb-4 text-center">
            {/* Segmented Auth Mode Switcher */}
            <div className="flex rounded-full bg-[#F3EDE6] p-1 mb-3 border border-[#EAE3DB]">
              <Link
                to="/login"
                className="flex-1 py-1.5 text-center text-xs font-semibold rounded-full text-[#4D6B6D] hover:text-[#0F3336] transition-colors"
              >
                Sign in
              </Link>
              <span className="flex-1 py-1.5 text-center text-xs font-semibold rounded-full bg-[#195A5F] text-white shadow-subtle">
                Create account
              </span>
            </div>

            <CardTitle className="text-xl font-serif font-bold text-[#0F3336]">
              Create Patient Account
            </CardTitle>
            <CardDescription className="text-xs text-[#4D6B6D]">
              Begin tracking your daily blood glucose readings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
