'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (type: ToastType, message: string, description?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  toast: () => {},
  dismiss: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((type: ToastType, message: string, description?: string) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, type, message, description }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none',
    }}>
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

const typeConfig: Record<ToastType, { icon: string; bg: string; border: string; color: string }> = {
  success: { icon: '✅', bg: 'var(--color-success-light)', border: 'var(--color-success-border)', color: 'var(--color-success)' },
  error: { icon: '❌', bg: 'var(--color-error-light)', border: 'var(--color-error-border)', color: 'var(--color-error)' },
  warning: { icon: '⚠️', bg: 'var(--color-warning-light)', border: 'var(--color-warning-border)', color: 'var(--color-warning)' },
  info: { icon: '💡', bg: 'var(--color-info-light)', border: 'var(--color-info-border)', color: 'var(--color-info)' },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const config = typeConfig[toast.type];

  return (
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '14px 16px',
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: 12,
        boxShadow: 'var(--shadow-lg)',
        minWidth: 300, maxWidth: 400,
        pointerEvents: 'all',
        animation: 'slideInRight 0.2s ease-out',
      }}
    >
      <style>{`@keyframes slideInRight { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:translateX(0) } }`}</style>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{config.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-gray-800)', lineHeight: 1.4 }}>
          {toast.message}
        </div>
        {toast.description && (
          <div style={{ fontSize: 12, color: 'var(--color-gray-500)', marginTop: 2, lineHeight: 1.4 }}>
            {toast.description}
          </div>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-gray-400)', fontSize: 16, padding: '0 0 0 4px', flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}
