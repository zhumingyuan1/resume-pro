'use client';

import { useEffect, useRef } from 'react';
import Button from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = { sm: 400, md: 520, lg: 680 };

export default function Modal({
  open, onClose, title, description, children, footer, size = 'md',
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      <style>{`@keyframes fadeIn { from { opacity:0 } to { opacity:1 } } @keyframes slideUp { from { opacity:0; transform: translateY(12px) } to { opacity:1; transform: translateY(0) } }`}</style>
      <div style={{
        width: '100%', maxWidth: sizeMap[size],
        background: '#fff', borderRadius: 16,
        boxShadow: 'var(--shadow-xl)',
        animation: 'slideUp 0.2s ease-out',
        overflow: 'hidden',
      }}>
        {/* Header */}
        {(title || description) && (
          <div style={{ padding: '24px 24px 0' }}>
            {title && (
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-gray-900)', margin: '0 0 6px' }}>
                {title}
              </h2>
            )}
            {description && (
              <p style={{ fontSize: 13, color: 'var(--color-gray-500)', margin: 0, lineHeight: 1.5 }}>
                {description}
              </p>
            )}
          </div>
        )}

        {/* Body */}
        <div style={{ padding: children ? '20px 24px' : '0 24px 24px' }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding: '16px 24px', borderTop: '1px solid var(--color-gray-100)',
            display: 'flex', justifyContent: 'flex-end', gap: 10,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Confirm 确认对话框
interface ConfirmProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  loading?: boolean;
}

export function Confirm({
  open, onClose, onConfirm, title, description,
  confirmText = '确认', cancelText = '取消', danger = false, loading = false,
}: ConfirmProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>取消</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </>
      }
    >
      {null}
    </Modal>
  );
}
