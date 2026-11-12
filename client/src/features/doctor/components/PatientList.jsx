import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { LoadingSpinner } from '../../../components/feedback/LoadingSpinner.jsx';

export function PatientList({ patients = [], isLoading = false, error = null }) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-48 items-center justify-center">
          <LoadingSpinner size="md" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        Failed to load linked patients. {error.message}
      </div>
    );
  }

  if (!patients || patients.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-slate-100 p-3 text-2xl mb-3">🩺</div>
          <h3 className="text-base font-medium text-slate-800">No linked patients found</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm">
            You do not currently have any patients linked to your clinical account.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assigned Patients ({patients.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {patients.map((patient) => (
            <div
              key={patient.id}
              className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
            >
              <div>
                <h4 className="text-sm font-semibold text-slate-900">{patient.name}</h4>
                <p className="text-xs text-slate-500">{patient.email}</p>
              </div>
              <div>
                <Link to={`/doctor/patients/${patient.id}/reports`}>
                  <Button variant="outline" size="sm">
                    View Reports
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
