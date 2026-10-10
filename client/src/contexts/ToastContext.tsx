import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toast: (title: string, options?: { message?: string; type?: ToastType; duration?: number }) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (
      title: string,
      options: { message?: string; type?: ToastType; duration?: number } = {}
    ) => {
      const id = Math.random().toString(36).substring(2, 9);
      const { message, type = 'info', duration = 4000 } = options;
      const newToast: Toast = { id, title, message, type };

      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, message?: string) => addToast(title, { message, type: 'success' }),
    [addToast]
  );
  const error = useCallback(
    (title: string, message?: string) => addToast(title, { message, type: 'error' }),
    [addToast]
  );
  const info = useCallback(
    (title: string, message?: string) => addToast(title, { message, type: 'info' }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info }}>
      {children}
      {/* Toast viewport */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-[0_8px_20px_rgba(0,0,0,0.08)] bg-white animate-fade-in ${
              t.type === 'success'
                ? 'border-[#D2ECE1]'
                : t.type === 'error'
                ? 'border-[#FCE4E4]'
                : 'border-[#E7E9ED]'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#16835D]" />}
              {t.type === 'error' && <AlertCircle className="w-4 h-4 text-[#C84B4B]" />}
              {t.type === 'info' && <Info className="w-4 h-4 text-[#176B57]" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#17191C]">{t.title}</p>
              {t.message && (
                <p className="text-[11px] text-[#737983] mt-0.5 leading-snug">{t.message}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-[#737983] hover:text-[#17191C] p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toast: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
    };
  }
  return context;
};
