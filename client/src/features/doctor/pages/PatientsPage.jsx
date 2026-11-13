import React from 'react';
import { usePatients } from '../hooks/usePatients.js';
import { PatientList } from '../components/PatientList.jsx';

export default function PatientsPage() {
  const { data: patients, isLoading, error } = usePatients();

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Clinical Masthead */}
      <div className="pb-2 border-b border-[#EAE3DB]">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#128B80]">
          Physician Portal
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0F3336] tracking-tight mt-0.5">
          Assigned Patient Roster
        </h1>
        <p className="mt-1 text-sm text-[#4D6B6D]">
          Review and monitor assigned patient cohorts, glucose logs, and ADA clinical adherence reports.
        </p>
      </div>

      <PatientList patients={patients} isLoading={isLoading} error={error} />
    </div>
  );
}
