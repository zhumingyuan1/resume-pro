'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from './button';

// ===== Dialog/Modal =====
interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onOpenChange) onOpenChange(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => onOpenChange?.(false)}
      />
      {/* Panel */}
      <div
        className={cn(
          'relative z-50 w-full max-w-lg mx-4',
          'bg-white rounded-2xl shadow-2xl border border-slate-200/60',
          'animate-in fade-in zoom-in-95 duration-200'
        )}
        style={{ maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        {children}
      </div>
      <style>{`
        @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes zoom-in-95 { from { opacity: 0; transform: scale(0.96) } to { opacity: 1; transform: scale(1) } }
        .animate-in { animation: fade-in 0.15s ease-out, zoom-in-95 0.15s ease-out; }
      `}</style>
    </div>,
    document.body
  );
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col gap-1.5 p-6 pb-0', className)} {...props} />
  );
}

function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn('text-lg font-semibold text-slate-900 leading-none tracking-tight', className)} {...props} />
  );
}

function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-slate-500', className)} {...props} />
  );
}

function DialogContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 py-4 overflow-y-auto flex-1', className)} {...props} />
  );
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-end gap-2 p-4 pt-0', className)} {...props} />
  );
}

function DialogClose({ onClose, children }: { onClose?: () => void; children?: React.ReactNode }) {
  return (
    <button
      onClick={onClose}
      className={cn(
        'absolute right-4 top-4 rounded-lg p-1 text-slate-400',
        'hover:bg-slate-100 hover:text-slate-600',
        'transition-colors duration-150'
      )}
    >
      <X className="h-4 w-4" />
    </button>
  );
}

export {
  Dialog, DialogHeader, DialogTitle, DialogDescription,
  DialogContent, DialogFooter, DialogClose,
};
