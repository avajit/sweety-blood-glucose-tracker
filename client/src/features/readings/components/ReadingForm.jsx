import React, { useState, useId } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getCreateReadingSchema } from '@sweety/shared/schemas/reading.schema.js';
import { SLOT_VALUES } from '@sweety/shared/constants/slots.js';
import { LIMITS } from '@sweety/shared/constants/limits.js';
import { todayInTimezone } from '@sweety/shared/utils/date.js';
import { getReadingClinicalAssessment } from '@sweety/shared/utils/clinical.js';
import { useCreateReading } from '../hooks/useCreateReading.js';
import { useUpdateReading } from '../hooks/useUpdateReading.js';
import { formatSlot } from '../../../lib/format.js';
import { Button } from '../../../components/ui/Button.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';

const readingFormSchema = getCreateReadingSchema(LIMITS.DEFAULT_APP_TIMEZONE);

export function ReadingForm({ initialData = null, onSuccess, onCancel }) {
  const isEdit = Boolean(initialData?.id);
  const createMutation = useCreateReading();
  const updateMutation = useUpdateReading();
  const [serverError, setServerError] = useState(null);

  const valueId = useId();
  const slotId = useId();
  const dateId = useId();
  const notesId = useId();
  const carbsId = useId();
  const insulinId = useId();

  const today = todayInTimezone();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(readingFormSchema),
    defaultValues: {
      date: initialData?.readingDate || initialData?.date || today,
      slot: initialData?.slot || SLOT_VALUES[0],
      value: initialData?.value ?? '',
      notes: initialData?.notes || '',
      carbsGrams: initialData?.carbsGrams ?? '',
      insulinUnits: initialData?.insulinUnits ?? '',
    },
  });

  const watchedValue = useWatch({ control, name: 'value' });
  const watchedSlot = useWatch({ control, name: 'slot' });

  const numValue = Number(watchedValue);
  const assessment =
    !Number.isNaN(numValue) && numValue >= 40 && numValue <= 600
      ? getReadingClinicalAssessment(numValue, watchedSlot)
      : null;

  const onSubmit = async (data) => {
    try {
      setServerError(null);
      const payload = {
        value: Number(data.value),
        slot: data.slot,
        date: data.date,
        notes: data.notes ? data.notes.trim() : null,
        carbsGrams:
          data.carbsGrams !== '' && data.carbsGrams !== null && data.carbsGrams !== undefined
            ? Number(data.carbsGrams)
            : null,
        insulinUnits:
          data.insulinUnits !== '' && data.insulinUnits !== null && data.insulinUnits !== undefined
            ? Number(data.insulinUnits)
            : null,
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: initialData.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }

      if (onSuccess) {
        onSuccess(payload);
      }
    } catch (err) {
      setServerError(err.message || 'Failed to save glucose reading.');
    }
  };

  const isLoading = isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
        >
          {serverError}
        </div>
      )}

      {/* Glucose Value Input & Clinical Badge */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor={valueId} className="block text-sm font-medium text-slate-700">
            Blood Glucose (mg/dL)
          </label>
          {assessment && (
            <Badge
              variant={
                assessment.color === 'green'
                  ? 'success'
                  : assessment.color === 'rose' || assessment.color === 'red'
                    ? 'danger'
                    : 'warning'
              }
            >
              {assessment.label}
            </Badge>
          )}
        </div>
        <Input
          id={valueId}
          type="number"
          step="1"
          placeholder="e.g. 110"
          error={errors.value?.message}
          {...register('value')}
        />
        {errors.value && (
          <p className="mt-1 text-xs text-rose-600" role="alert">
            {errors.value.message}
          </p>
        )}
        {assessment?.alert && (
          <p className="mt-1.5 text-xs font-semibold text-rose-600">
            ⚠️ {assessment.alert}
          </p>
        )}
      </div>

      {/* Meal Slot Select */}
      <div>
        <label htmlFor={slotId} className="block text-sm font-medium text-slate-700 mb-1">
          Meal / Clinical Slot
        </label>
        <select
          id={slotId}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          {...register('slot')}
        >
          {SLOT_VALUES.map((slot) => (
            <option key={slot} value={slot}>
              {formatSlot(slot)}
            </option>
          ))}
        </select>
        {errors.slot && (
          <p className="mt-1 text-xs text-rose-600" role="alert">
            {errors.slot.message}
          </p>
        )}
      </div>

      {/* Date Picker Input */}
      <div>
        <label htmlFor={dateId} className="block text-sm font-medium text-slate-700 mb-1">
          Reading Date
        </label>
        <Input
          id={dateId}
          type="date"
          max={today}
          error={errors.date?.message}
          {...register('date')}
        />
        {errors.date && (
          <p className="mt-1 text-xs text-rose-600" role="alert">
            {errors.date.message}
          </p>
        )}
      </div>

      {/* Optional Clinical Correlates: Carbohydrates & Insulin */}
      <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-3">
        <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
          Clinical Correlates (Optional)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor={carbsId} className="block text-xs font-medium text-slate-700 mb-1">
              Carbohydrates (grams)
            </label>
            <Input
              id={carbsId}
              type="number"
              min="0"
              max="300"
              placeholder="e.g. 45"
              error={errors.carbsGrams?.message}
              {...register('carbsGrams')}
            />
            {errors.carbsGrams && (
              <p className="mt-1 text-xs text-rose-600" role="alert">
                {errors.carbsGrams.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor={insulinId} className="block text-xs font-medium text-slate-700 mb-1">
              Rapid Insulin (units)
            </label>
            <Input
              id={insulinId}
              type="number"
              step="0.5"
              min="0"
              max="100"
              placeholder="e.g. 4.0"
              error={errors.insulinUnits?.message}
              {...register('insulinUnits')}
            />
            {errors.insulinUnits && (
              <p className="mt-1 text-xs text-rose-600" role="alert">
                {errors.insulinUnits.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Notes (Optional) */}
      <div>
        <label htmlFor={notesId} className="block text-sm font-medium text-slate-700 mb-1">
          Notes (Optional)
        </label>
        <Input
          id={notesId}
          type="text"
          placeholder="e.g. 30 min post-brisk walk"
          error={errors.notes?.message}
          {...register('notes')}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={isLoading}
        >
          {isEdit ? 'Update Reading' : 'Save Reading'}
        </Button>
      </div>
    </form>
  );
}
