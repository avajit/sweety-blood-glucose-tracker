import { SLOT_LABELS } from '@sweety/shared/constants/slots.js';
import { CLINICAL_STATUS } from '@sweety/shared/constants/clinical.js';

/**
 * Returns human-readable label for a meal slot.
 * @param {string} slot
 * @returns {string}
 */
export function formatSlot(slot) {
  return SLOT_LABELS[slot] || slot;
}

/**
 * Formats a glucose value with unit.
 * @param {number | null | undefined} value
 * @returns {string}
 */
export function formatGlucose(value) {
  if (value === null || value === undefined) return '—';
  return `${value} mg/dl`;
}

/**
 * Returns styling classes and label for a clinical classification.
 * @param {string} classification
 * @returns {{ label: string, badgeClass: string, dotClass: string }}
 */
export function getClinicalMeta(classification) {
  switch (classification) {
    case CLINICAL_STATUS.IN_TARGET:
      return {
        label: 'In Target',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotClass: 'bg-emerald-500',
      };
    case CLINICAL_STATUS.MILD_LOW:
      return {
        label: 'Low',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        dotClass: 'bg-amber-500',
      };
    case CLINICAL_STATUS.SEVERE_LOW:
      return {
        label: 'Critical Low',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse',
        dotClass: 'bg-rose-600',
      };
    case CLINICAL_STATUS.ELEVATED:
      return {
        label: 'Elevated',
        badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
        dotClass: 'bg-orange-500',
      };
    case CLINICAL_STATUS.SEVERE_HIGH:
      return {
        label: 'Severe High',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        dotClass: 'bg-purple-600',
      };
    default:
      return {
        label: 'Normal',
        badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
        dotClass: 'bg-slate-400',
      };
  }
}
