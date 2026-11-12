import React, { useState } from 'react';
import { formatSlot, formatGlucose } from '../../../lib/format.js';
import { useDeleteReading } from '../hooks/useDeleteReading.js';
import { Button } from '../../../components/ui/Button.jsx';

export function DeleteReadingDialog({ reading, isOpen, onClose }) {
  const deleteMutation = useDeleteReading();
  const [error, setError] = useState(null);

  if (!isOpen || !reading) return null;

  const handleDelete = async () => {
    try {
      setError(null);
      await deleteMutation.mutateAsync(reading.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete reading.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <h3 id="delete-dialog-title" className="text-lg font-bold text-slate-900">
          Delete Blood Glucose Reading
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Are you sure you want to permanently delete this reading for{' '}
          <strong className="text-slate-800">{formatSlot(reading.slot)}</strong> on{' '}
          <strong className="text-slate-800">{reading.readingDate}</strong> ({formatGlucose(reading.value)})?
        </p>

        {error && (
          <div role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            isLoading={deleteMutation.isPending}
            disabled={deleteMutation.isPending}
          >
            Delete Reading
          </Button>
        </div>
      </div>
    </div>
  );
}
