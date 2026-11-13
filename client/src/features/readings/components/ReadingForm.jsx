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
import {
  SlotFastingIcon,
  SlotBreakfastIcon,
  SlotLunchIcon,
  SlotDinnerIcon,
  CarbsIcon,
  InsulinIcon,
  NotesIcon,
} from '../../../components/icons/index.jsx';

const readingFormSchema = getCreateReadingSchema(LIMITS.DEFAULT_APP_TIMEZONE);

const slotIcons = {
  MORNING_FASTING: SlotFastingIcon,
  AFTER_BREAKFAST: SlotBreakfastIcon,
  AFTER_LUNCH: SlotLunchIcon,
  AFTER_DINNER: SlotDinnerIcon,
};

export function ReadingForm({ initialData = null, onSuccess, onCancel }) {
  const isEdit = Boolean(initialData?.id);
  const createMutation = useCreateReading();
  const updateMutation = useUpdateReading();
  const [serverError, setServerError] = useState(null);

  const valueId = useId();
  const slotId = useId();
  const dateId = useId();
  const timeId = useId();
  const notesId = useId();
  const carbsId = useId();
  const insulinId = useId();

  const today = todayInTimezone();
  const nowTime = new Date().toTimeString().slice(0, 5);

  const {
    register,
    handleSubmit,
    setValue,
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {serverError && (
        <div
          role="alert"
          className="rounded-lg border border-[#FECACA] bg-[#FEE2E2] p-3.5 text-sm font-medium text-[#991B1B]"
        >
          {serverError}
        </div>
      )}

      {/* 1. Large Clinical Glucose Input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor={valueId} className="block text-sm font-semibold text-[#0F3336]">
            Blood Glucose
          </label>
          {assessment && (
            <Badge
              variant={
                assessment.color === 'green'
                  ? 'target'
                  : assessment.color === 'rose' || assessment.color === 'red'
                    ? 'critical'
                    : 'low'
              }
            >
              {assessment.label}
            </Badge>
          )}
        </div>

        <div className="relative rounded-xl border border-[#EAE3DB] bg-white focus-within:ring-2 focus-within:ring-[#195A5F] transition-all">
          <input
            id={valueId}
            type="number"
            step="1"
            inputMode="numeric"
            placeholder="e.g. 110"
            aria-invalid={Boolean(errors.value)}
            className="w-full bg-transparent px-4 py-3 text-2xl font-bold tabular-nums text-[#0F3336] placeholder:text-[#4D6B6D]/30 focus:outline-none"
            {...register('value')}
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-wider text-[#4D6B6D]">
            mg/dL
          </span>
        </div>

        {errors.value && (
          <p className="mt-1.5 text-xs font-medium text-[#991B1B]" role="alert">
            {errors.value.message}
          </p>
        )}
        {assessment?.alert && (
          <p className="mt-1 text-xs font-semibold text-[#991B1B]">
            Notice: {assessment.alert}
          </p>
        )}
      </div>

      {/* 2. Reading Slot Selector: Four Selectable Chips */}
      <div>
        <label htmlFor={slotId} className="block text-sm font-semibold text-[#0F3336] mb-2">
          Meal / Clinical Slot
        </label>

        {/* Hidden Accessible Native Select (Ensures standard form / test compatibility) */}
        <select
          id={slotId}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          {...register('slot')}
        >
          {SLOT_VALUES.map((slot) => (
            <option key={slot} value={slot}>
              {formatSlot(slot)}
            </option>
          ))}
        </select>

        {/* 4 Tactile Slot Chips */}
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
          {SLOT_VALUES.map((slot) => {
            const Icon = slotIcons[slot] || SlotFastingIcon;
            const isSelected = watchedSlot === slot;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => setValue('slot', slot, { shouldValidate: true })}
                className={`flex items-center space-x-2.5 rounded-xl border p-3 text-left transition-all ${
                  isSelected
                    ? 'border-[#195A5F] bg-[#195A5F] text-white shadow-subtle'
                    : 'border-[#EAE3DB] bg-white text-[#0F3336] hover:bg-[#F3EDE6]/40'
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isSelected ? 'text-white' : 'text-[#128B80]'}`} />
                <span className="text-xs sm:text-sm font-medium leading-snug">{formatSlot(slot)}</span>
              </button>
            );
          })}
        </div>

        {errors.slot && (
          <p className="mt-1.5 text-xs font-medium text-[#991B1B]" role="alert">
            {errors.slot.message}
          </p>
        )}
      </div>

      {/* 3. Date & Time Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label htmlFor={dateId} className="block text-sm font-semibold text-[#0F3336] mb-1">
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
            <p className="mt-1 text-xs font-medium text-[#991B1B]" role="alert">
              {errors.date.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={timeId} className="block text-sm font-semibold text-[#0F3336] mb-1">
            Reading Time
          </label>
          <Input
            id={timeId}
            type="time"
            defaultValue={nowTime}
          />
        </div>
      </div>

      {/* 4. Optional Clinical Correlates */}
      <div className="border-t border-[#EAE3DB] pt-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#128B80] block mb-3">
          Optional Clinical Correlates
        </span>
        <div className="space-y-4 rounded-xl border border-[#EAE3DB] bg-white p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor={carbsId} className="flex items-center space-x-1.5 text-xs font-semibold text-[#0F3336] mb-1">
                <CarbsIcon className="h-4 w-4 text-[#D0976C]" />
                <span>Carbohydrates (grams)</span>
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
                <p className="mt-1 text-xs font-medium text-[#991B1B]" role="alert">
                  {errors.carbsGrams.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor={insulinId} className="flex items-center space-x-1.5 text-xs font-semibold text-[#0F3336] mb-1">
                <InsulinIcon className="h-4 w-4 text-[#128B80]" />
                <span>Rapid Insulin (units)</span>
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
                <p className="mt-1 text-xs font-medium text-[#991B1B]" role="alert">
                  {errors.insulinUnits.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor={notesId} className="flex items-center space-x-1.5 text-xs font-semibold text-[#0F3336] mb-1">
              <NotesIcon className="h-4 w-4 text-[#4D6B6D]" />
              <span>Notes</span>
            </label>
            <Input
              id={notesId}
              type="text"
              placeholder="e.g. 30 min post-brisk walk"
              error={errors.notes?.message}
              {...register('notes')}
            />
          </div>
        </div>
      </div>

      {/* 5. Submission Button */}
      <div className="pt-2">
        <Button
          type="submit"
          className="w-full text-base py-3"
          isLoading={isLoading}
          disabled={isLoading}
        >
          {isEdit ? 'Update Reading' : 'Save Reading'}
        </Button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full text-center text-xs font-medium text-muted-foreground hover:text-foreground mt-3 py-1 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
