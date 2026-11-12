import React from 'react';
import { usePatients } from '../hooks/usePatients.js';
import { PatientList } from '../components/PatientList.jsx';

export default function PatientsPage() {
  const { data: patients, isLoading, error } = usePatients();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Doctor Portal — Patient List</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review and monitor assigned patient cohorts, glucose readings, and clinical adherence reports.
          </p>
        </div>
      </div>

      <PatientList patients={patients} isLoading={isLoading} error={error} />
    </div>
  );
}
