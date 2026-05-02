'use client';

import { HTMLAttributes, forwardRef } from 'react';

type CardVariant = 'bordered' | 'elevated' | 'filled';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

const variantStyles: Record<CardVariant, React.CSSProperties> = {
  bordered: {
    background: 'var(--color-white)',
    border: '1px solid var(--color-gray-200)',
    boxShadow: 'var(--shadow-xs)',
  },
  elevated: {
    background: 'var(--color-white)',
    border: '1px solid var(--color-gray-100)',
    boxShadow: 'var(--shadow-md)',
  },
  filled: {
    background: 'var(--color-gray-50)',
    border: '1px solid var(--color-gray-100)',
    boxShadow: 'none',
  },
};

const paddingMap = {
  none: '0',
  sm: '12px',
  md: '20px',
  lg: '28px',
};

const Card = forwardRef<HTMLDivElement, CardProps>(({
  variant = 'bordered',
  padding = 'md',
  hoverable = false,
  children,
  style,
  ...props
}, ref) => {
  const baseStyle: React.CSSProperties = {
    borderRadius: 'var(--radius-lg)',
    transition: 'all var(--transition-base)',
    ...variantStyles[variant],
    padding: paddingMap[padding],
    ...(hoverable && {
      cursor: 'pointer',
    }),
    ...style,
  };

  return (
    <div
      ref={ref}
      style={baseStyle}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
