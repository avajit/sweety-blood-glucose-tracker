import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button.jsx';
import { CLINICAL_TARGETS } from '@sweety/shared/constants/clinical.js';
import { AlertCircleIcon } from '../../../components/icons/index.jsx';

/**
 * Formats seconds into MM:SS string.
 * @param {number} totalSeconds
 * @returns {string}
 */
function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function HypoglycemiaAlertModal({ value, isOpen, onClose }) {
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes = 900 seconds
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  if (!isOpen || value === null || value === undefined) {
    return null;
  }

  const isSevere = value <= CLINICAL_TARGETS.HYPO_CRITICAL; // <= 54 mg/dL

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(15 * 60);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hypo-alert-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div
        className={`w-full max-w-lg rounded-2xl border p-6 sm:p-7 shadow-2xl transition-all bg-white ${
          isSevere
            ? 'border-[#991B1B] ring-4 ring-[#991B1B]/15'
            : 'border-[#D0976C] ring-4 ring-[#D0976C]/15'
        }`}
      >
        {/* Urgency Badge & Title */}
        <div className="flex items-start space-x-3.5">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
              isSevere
                ? 'bg-[#FEE2E2] text-[#991B1B]'
                : 'bg-[#D0976C]/20 text-[#8C5832]'
            }`}
          >
            <AlertCircleIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 id="hypo-alert-title" className="text-xl font-bold text-[#0F3336]">
              {isSevere
                ? `Critical Low: ${value} mg/dL (Level 2)`
                : `Low Blood Glucose: ${value} mg/dL (Level 1)`}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-[#4D6B6D] leading-relaxed">
              {isSevere
                ? 'Your glucose level is critically low. Take fast-acting carbohydrates immediately.'
                : 'Your glucose reading is below the 70 mg/dL target. Follow the ADA Rule of 15.'}
            </p>
          </div>
        </div>

        {/* Clinical ADA Rule of 15 Protocol Card */}
        <div className="mt-5 rounded-xl border border-[#EAE3DB] bg-[#F3EDE6]/40 p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#195A5F]">
            ADA Rule of 15 Emergency Protocol
          </h4>
          <ol className="mt-2.5 space-y-2 text-xs text-[#0F3336]">
            <li className="flex items-start space-x-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#195A5F] text-[10px] font-bold text-white">
                1
              </span>
              <span>
                <strong>Consume 15g of fast-acting carbs:</strong> 4 oz (1/2 cup) fruit juice, 1/2 can regular soda, 3–4 glucose tablets, or 1 tablespoon of sugar/honey.
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#195A5F] text-[10px] font-bold text-white">
                2
              </span>
              <span>
                <strong>Wait 15 minutes:</strong> Rest and allow the fast-acting carbohydrates to absorb into your bloodstream.
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#195A5F] text-[10px] font-bold text-white">
                3
              </span>
              <span>
                <strong>Re-check blood glucose:</strong> If still under 70 mg/dL, repeat with another 15g carbohydrates.
              </span>
            </li>
          </ol>
        </div>

        {/* Interactive 15-Minute Countdown Timer */}
        <div className="mt-4 flex flex-col items-center justify-center rounded-xl bg-[#0F292B] border border-[#1F4A4E] p-4 text-white shadow-inner">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#8FAEB0]">
            15-Minute Absorption Timer
          </div>
          <div className="my-1.5 font-mono text-3xl sm:text-4xl font-bold tracking-tight text-[#F3EDE6]">
            {formatTime(timeLeft)}
          </div>
          <div className="flex space-x-2 mt-2">
            {!isRunning ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStart}
                className="bg-white/10 text-white hover:bg-white/20 border-white/20 text-xs"
              >
                Start Timer
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePause}
                className="bg-[#D0976C]/25 text-[#E8BC99] hover:bg-[#D0976C]/35 border-[#D0976C]/40 text-xs"
              >
                Pause
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-[#8FAEB0] hover:text-white text-xs"
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Severe Notice Warning */}
        {isSevere && (
          <div className="mt-3.5 rounded-xl bg-[#FEE2E2]/70 p-3 text-xs text-[#991B1B] border border-[#991B1B]/30">
            ⚠️ <strong>Medical Emergency:</strong> If you feel confused, faint, or cannot swallow, call emergency services (911/112) or have someone administer emergency glucagon immediately.
          </div>
        )}

        {/* Action Button */}
        <div className="mt-5 flex justify-end">
          <Button
            onClick={onClose}
            className={`w-full text-sm py-2.5 ${
              isSevere
                ? 'bg-[#991B1B] hover:bg-[#7F1D1D] text-white focus-visible:ring-[#991B1B]'
                : 'bg-[#195A5F] hover:bg-[#14484B] text-white'
            }`}
          >
            I Have Consumed 15g Carbs / Acknowledge
          </Button>
        </div>
      </div>
    </div>
  );
}
