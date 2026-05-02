'use client';

import { useState } from 'react';

interface FreeEntryProps {
  placeholder?: string;
  value?: string;
  onChange?: (val: string) => void;
  rows?: number;
}

export default function FreeEntry({ placeholder = '填写其他内容', value = '', onChange, rows = 4 }: FreeEntryProps) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginTop: 12 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 0', fontSize: 12, color: '#9ca3af',
          background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <span style={{ transition: 'transform 0.15s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}>▶</span>
        我还有其他想写的
      </button>
      {open && (
        <div style={{ marginTop: 10 }}>
          <textarea
            value={value}
            onChange={e => onChange?.(e.target.value)}
            rows={rows}
            placeholder={placeholder}
            style={{
              width: '100%', padding: '10px 14px', fontSize: 13,
              border: '1.5px solid #e5e7eb', borderRadius: 10, outline: 'none',
              resize: 'vertical', lineHeight: 1.7, color: '#374151', background: '#fff',
              transition: 'all 0.15s',
            }}
            onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
            onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
      )}
    </div>
  );
}
