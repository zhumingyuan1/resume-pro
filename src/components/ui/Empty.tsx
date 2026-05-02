'use client';

import Button from './Button';

interface EmptyProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondary?: {
    label: string;
    onClick: () => void;
  };
}

export default function Empty({
  icon = '📋',
  title,
  description,
  action,
  secondary,
}: EmptyProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '40px 20px', textAlign: 'center',
    }}>
      {/* 插画区 */}
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'var(--color-gray-50)',
        border: '1px solid var(--color-gray-200)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 36, marginBottom: 20,
      }}>
        {icon}
      </div>

      {/* 文字 */}
      <div style={{ maxWidth: 280 }}>
        <h3 style={{
          fontSize: 15, fontWeight: 600, color: 'var(--color-gray-800)',
          margin: '0 0 8px', lineHeight: 1.4,
        }}>
          {title}
        </h3>
        {description && (
          <p style={{
            fontSize: 13, color: 'var(--color-gray-500)',
            margin: 0, lineHeight: 1.6,
          }}>
            {description}
          </p>
        )}
      </div>

      {/* 操作按钮 */}
      {(action || secondary) && (
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          {secondary && (
            <Button variant="secondary" size="md" onClick={secondary.onClick}>
              {secondary.label}
            </Button>
          )}
          {action && (
            <Button variant="primary" size="md" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
