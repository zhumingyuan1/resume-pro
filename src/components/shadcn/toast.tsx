'use client';

import * as React from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from './button';

// ===== Toast =====
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (type: ToastType, title: string, description?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  toast: () => {},
  dismiss: () => {},
});

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((type: ToastType, title: string, description?: string) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, type, title, description }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

const typeConfig: Record<ToastType, { icon: React.ReactNode; bg: string; border: string; iconColor: string }> = {
  success: {
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    bg: 'bg-white',
    border: 'border-emerald-200',
    iconColor: 'text-emerald-600',
  },
  error: {
    icon: <AlertCircle className="h-5 w-5 text-red-500" />,
    bg: 'bg-white',
    border: 'border-red-200',
    iconColor: 'text-red-600',
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    bg: 'bg-white',
    border: 'border-amber-200',
    iconColor: 'text-amber-600',
  },
  info: {
    icon: <Info className="h-5 w-5 text-blue-500" />,
    bg: 'bg-white',
    border: 'border-blue-200',
    iconColor: 'text-blue-600',
  },
};

function ToastContainer() {
  const { toasts, dismiss } = useContext(ToastContext);

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-all flex items-start gap-3 p-4 rounded-xl border shadow-xl bg-white min-w-[300px] max-w-[380px]',
            'animate-in slide-in-from-bottom-3 fade-in duration-200',
            typeConfig[toast.type].border
          )}
        >
          <div className="flex-shrink-0 mt-0.5">{typeConfig[toast.type].icon}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
            {toast.description && (
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{toast.description}</p>
            )}
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="flex-shrink-0 p-0.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slide-in-from-bottom-3 { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        .animate-in { animation: slide-in-from-bottom-3 0.2s ease-out, fade-in 0.15s ease-out; }
        @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </div>
  );
}

function useToast() {
  return useContext(ToastContext);
}

export { ToastProvider, useToast };
