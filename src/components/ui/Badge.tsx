'use client';

import { HTMLAttributes } from 'react';

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: { background: 'var(--color-gray-100)', color: 'var(--color-gray-600)' },
  primary: { background: 'var(--color-primary-light)', color: 'var(--color-primary)' },
  secondary: { background: 'var(--color-secondary-light)', color: 'var(--color-secondary)' },
  success: { background: 'var(--color-success-light)', color: 'var(--color-success)' },
  warning: { background: 'var(--color-warning-light)', color: 'var(--color-warning)' },
  error: { background: 'var(--color-error-light)', color: 'var(--color-error)' },
  info: { background: 'var(--color-info-light)', color: 'var(--color-info)' },
};

const sizeStyles: Record<BadgeSize, React.CSSProperties> = {
  sm: { padding: '1px 6px', fontSize: '10px' },
  md: { padding: '2px 8px', fontSize: 'var(--text-xs)' },
};

export default function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  style,
  ...props
}: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        borderRadius: 'var(--radius-full)',
        fontWeight: 500,
        lineHeight: 1,
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      {...props}
    >
      {dot && (
        <span style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: 'currentColor',
          flexShrink: 0,
        }} />
      )}
      {children}
    </span>
  );
}
