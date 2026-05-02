'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'text';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: {
    background: 'var(--color-primary)',
    color: '#fff',
    border: 'none',
  },
  secondary: {
    background: 'var(--color-gray-100)',
    color: 'var(--color-gray-700)',
    border: '1px solid var(--color-gray-200)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-gray-600)',
    border: '1px solid transparent',
  },
  danger: {
    background: 'var(--color-error)',
    color: '#fff',
    border: 'none',
  },
  text: {
    background: 'transparent',
    color: 'var(--color-primary)',
    border: 'none',
    padding: '4px 8px',
  },
};

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { padding: '4px 10px', fontSize: '12px', gap: '4px', borderRadius: '6px' },
  md: { padding: '6px 14px', fontSize: '13px', gap: '6px', borderRadius: '8px' },
  lg: { padding: '8px 18px', fontSize: '14px', gap: '8px', borderRadius: '8px' },
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  children,
  disabled,
  style,
  ...props
}, ref) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 500,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all var(--transition-base)',
    whiteSpace: 'nowrap',
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...style,
  };

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      style={baseStyle}
      {...props}
    >
      {loading ? (
        <LoadingSpinner size={size} />
      ) : icon ? (
        <span style={{ display: 'flex', alignItems: 'center', fontSize: 'inherit' }}>{icon}</span>
      ) : null}
      {children && <span>{children}</span>}
      {iconRight && !loading && (
        <span style={{ display: 'flex', alignItems: 'center', fontSize: 'inherit' }}>{iconRight}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

function LoadingSpinner({ size }: { size: Size }) {
  const sizeMap = { sm: 12, md: 14, lg: 16 };
  const s = sizeMap[size];
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" />
    </svg>
  );
}

export default Button;
