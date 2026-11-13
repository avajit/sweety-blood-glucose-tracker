import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckIcon, AlertCircleIcon, CloseIcon } from '../icons/index.jsx';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Notification Container */}
      <aside
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex items-center justify-between rounded-xl border border-[#EAE3DB] bg-white p-3.5 shadow-subtle transition-all"
          >
            <div className="flex items-center space-x-2.5">
              {t.type === 'success' ? (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EBF7EE] text-[#1B6B2E]">
                  <CheckIcon className="h-3.5 w-3.5" strokeWidth={2} />
                </div>
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FEE2E2] text-[#991B1B]">
                  <AlertCircleIcon className="h-3.5 w-3.5" strokeWidth={2} />
                </div>
              )}
              <span className="text-sm font-medium text-[#0F3336]">{t.message}</span>
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="ml-3 text-[#4D6B6D] hover:text-[#0F3336] transition-colors p-1"
              aria-label="Dismiss notification"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </aside>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

