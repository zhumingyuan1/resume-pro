'use client';

import { useState, useRef, useEffect } from 'react';

interface HelpTipProps {
  title: string;       // 模块标题
  tips: string[];      // 帮助要点列表
  example?: string;     // 可选示例
  children: React.ReactNode;  // 表单内容
}

export default function HelpTip({ title, tips, example, children }: HelpTipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* 模块标题行 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1f2937' }}>{title}</h3>
        <button
          onClick={() => setOpen(!open)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', fontSize: 12,
            background: open ? '#eff6ff' : 'transparent',
            border: open ? '1px solid #bfdbfe' : '1px solid transparent',
            borderRadius: 20, cursor: 'pointer',
            color: open ? '#2563eb' : '#9ca3af',
            transition: 'all 0.15s',
          }}
        >
          📋 填写指南
        </button>
      </div>

      {/* 帮助面板 */}
      {open && (
        <div style={{
          marginBottom: 16,
          padding: 16,
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 12,
        }}>
          {tips.length > 0 && (
            <div style={{ marginBottom: example ? 12 : 0 }}>
              {tips.map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: i < tips.length - 1 ? 8 : 0 }}>
                  <span style={{ color: '#2563eb', fontWeight: 600, flexShrink: 0 }}>•</span>
                  <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{tip}</span>
                </div>
              ))}
            </div>
          )}
          {example && (
            <div style={{
              padding: '10px 12px',
              background: '#fff',
              border: '1px solid #e0e7ff',
              borderRadius: 8,
              fontSize: 12,
              color: '#6b7280',
              lineHeight: 1.6,
              fontStyle: 'italic',
            }}>
              📝 {example}
            </div>
          )}
        </div>
      )}

      {/* 表单内容 */}
      {children}
    </div>
  );
}
