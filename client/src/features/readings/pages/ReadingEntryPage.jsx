import React, { useState } from 'react';
import { useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import { ReadingForm } from '../components/ReadingForm.jsx';
import { HypoglycemiaAlertModal } from '../components/HypoglycemiaAlertModal.jsx';
import { useToast } from '../../../components/feedback/ToastContext.jsx';
import { ArrowLeftIcon } from '../../../components/icons/index.jsx';

export default function ReadingEntryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const toast = useToast();

  const [hypoAlertValue, setHypoAlertValue] = useState(null);

  // Initial data passed via location state or pre-selected slot
  const initialData = location.state?.reading || (location.state?.slot ? { slot: location.state.slot } : null);
  const isEdit = Boolean(id || initialData?.id);

  const handleSuccess = (payload) => {
    toast.success(isEdit ? 'Glucose reading updated successfully' : 'Glucose reading recorded');
    if (payload?.value && payload.value < 70) {
      setHypoAlertValue(payload.value);
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  const handleHypoClose = () => {
    setHypoAlertValue(null);
    navigate('/dashboard', { replace: true });
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="max-w-lg mx-auto py-4 sm:py-8">
      {/* Back Link */}
      <div className="mb-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-medium text-[#195A5F] hover:text-[#14484B] hover:underline"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Editorial Heading */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0F3336] tracking-tight">
          {isEdit ? 'Edit Glucose Reading' : 'Log a reading'}
        </h1>
        <p className="mt-1 text-sm text-[#4D6B6D]">
          {isEdit ? 'Update your clinical blood glucose record.' : 'Record your blood glucose.'}
        </p>
      </div>

      {/* Direct Form on Warm Canvas (No outer card) */}
      <div className="bg-transparent">
        <ReadingForm
          initialData={initialData}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>

      {/* Reactive Hypoglycemia Protocol Modal */}
      {hypoAlertValue && (
        <HypoglycemiaAlertModal
          value={hypoAlertValue}
          isOpen={Boolean(hypoAlertValue)}
          onClose={handleHypoClose}
        />
      )}
    </div>
  );
}
