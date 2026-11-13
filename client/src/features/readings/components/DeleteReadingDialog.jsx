import React, { useState } from 'react';
import { formatSlot, formatGlucose } from '../../../lib/format.js';
import { useDeleteReading } from '../hooks/useDeleteReading.js';
import { Button } from '../../../components/ui/Button.jsx';
import { AlertCircleIcon } from '../../../components/icons/index.jsx';

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#EAE3DB] bg-white p-6 shadow-2xl transition-all">
        <div className="flex items-center space-x-3 mb-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FEE2E2] text-[#991B1B]">
            <AlertCircleIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 id="delete-dialog-title" className="text-lg font-bold text-[#0F3336]">
              Delete Blood Glucose Reading
            </h3>
          </div>
        </div>

        <p className="text-sm text-[#4D6B6D] leading-relaxed">
          Are you sure you want to permanently delete this reading for{' '}
          <strong className="text-[#0F3336]">{formatSlot(reading.slot)}</strong> on{' '}
          <strong className="text-[#0F3336]">{reading.readingDate}</strong> ({formatGlucose(reading.value)})?
        </p>

        {error && (
          <div
            role="alert"
            className="mt-3 rounded-xl border border-[#991B1B]/30 bg-[#FEE2E2]/60 p-3 text-xs font-medium text-[#991B1B]"
          >
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end space-x-3 pt-3 border-t border-[#EAE3DB]">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deleteMutation.isPending}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            isLoading={deleteMutation.isPending}
            disabled={deleteMutation.isPending}
            className="text-xs"
          >
            Delete Reading
          </Button>
        </div>
      </div>
    </div>
  );
}
