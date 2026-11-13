import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { LoadingSpinner } from '../../../components/feedback/LoadingSpinner.jsx';
import { UserIcon, BarChartIcon } from '../../../components/icons/index.jsx';

export function PatientList({ patients = [], isLoading = false, error = null }) {
  if (isLoading) {
    return (
      <Card className="border-[#EAE3DB] bg-white">
        <CardContent className="flex h-48 items-center justify-center">
          <LoadingSpinner size="md" label="Loading linked patient roster..." />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-[#991B1B]/30 bg-[#FEE2E2]/60 p-4 text-xs font-medium text-[#991B1B]"
      >
        Failed to load linked patients. {error.message}
      </div>
    );
  }

  if (!patients || patients.length === 0) {
    return (
      <Card className="border-[#EAE3DB] bg-white">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-[#F3EDE6] p-3.5 text-[#195A5F] mb-3">
            <UserIcon className="h-6 w-6" />
          </div>
          <h3 className="text-base font-serif font-bold text-[#0F3336]">
            No linked patients found
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-[#4D6B6D] max-w-sm">
            You do not currently have any patients linked to your clinical account.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[#EAE3DB] bg-white overflow-hidden">
      <CardHeader className="pb-3 border-b border-[#EAE3DB] bg-[#F3EDE6]/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-serif font-bold text-[#0F3336]">
            Assigned Patients ({patients.length})
          </CardTitle>
          <span className="text-xs text-[#4D6B6D]">
            Direct clinical cohort
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-[#EAE3DB]">
          {patients.map((patient) => (
            <div
              key={patient.id}
              className="flex items-center justify-between px-6 py-4.5 hover:bg-[#F3EDE6]/25 transition-colors"
            >
              <div className="flex items-center space-x-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#195A5F]/10 text-[#195A5F] font-bold text-sm">
                  {patient.name?.charAt(0)?.toUpperCase() || 'P'}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#0F3336]">
                    {patient.name}
                  </h4>
                  <p className="text-xs text-[#4D6B6D] mt-0.5">
                    {patient.email}
                  </p>
                </div>
              </div>
              <div>
                <Link to={`/doctor/patients/${patient.id}/reports`}>
                  <Button variant="outline" size="sm" className="space-x-1.5 text-xs">
                    <BarChartIcon className="h-3.5 w-3.5 text-[#128B80]" />
                    <span>View Reports</span>
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
