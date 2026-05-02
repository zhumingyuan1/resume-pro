'use client';

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: string;
  hint?: string;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const baseInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  fontSize: 'var(--text-sm)',
  fontFamily: 'inherit',
  color: 'var(--color-gray-800)',
  background: 'var(--color-white)',
  border: '1px solid var(--color-gray-200)',
  borderRadius: 'var(--radius-md)',
  outline: 'none',
  transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  style,
  ...props
}, ref) => {
  const id = useId();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && (
        <label
          htmlFor={id}
          style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-gray-700)' }}
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        style={{
          ...baseInputStyle,
          borderColor: error ? 'var(--color-error)' : undefined,
          ...style,
        }}
        {...props}
      />
      {hint && !error && (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-500)' }}>{hint}</span>
      )}
      {error && (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)' }}>{error}</span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  hint,
  style,
  ...props
}, ref) => {
  const id = useId();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && (
        <label
          htmlFor={id}
          style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-gray-700)' }}
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        style={{
          ...baseInputStyle,
          resize: 'vertical',
          minHeight: '80px',
          borderColor: error ? 'var(--color-error)' : undefined,
          ...style,
        }}
        {...props}
      />
      {hint && !error && (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-500)' }}>{hint}</span>
      )}
      {error && (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)' }}>{error}</span>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Input;
